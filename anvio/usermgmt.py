# -*- coding: utf-8
"""
    user management db operations.
"""

import os
import sqlite3

import crypt
import string
import random
import hashlib
import shutil
import smtplib

import anvio
import anvio.filesnpaths as filesnpaths
import anvio.mailsetup as mailsetup

from anvio.errors import ConfigError


__author__ = "Tobias Paczian"
__copyright__ = "Copyright 2015, The anvio Project"
__credits__ = []
__license__ = "GPL 3.0"
__version__ = anvio.__version__
__maintainer__ = "Tobias Paczian"
__email__ = "tobiaspaczian@googlemail.com"
__status__ = "Development"

class UserMGMT:
    def __init__(self, path, client_version, new_database=False, ignore_version=False):
        self.path = path
        self.db_path = path + 'user.db'
        self.version = None

        if new_database:
            filesnpaths.is_output_file_writable(self.db_path)
        else:
            filesnpaths.is_file_exists(self.db_path)

        if new_database and os.path.exists(self.db_path):
            os.remove(self.db_path)

        self.conn = sqlite3.connect(self.db_path)
        self.conn.text_factory = str
        self.conn.row_factory = dict_factory

        self.cursor = self.conn.cursor()

        if new_database:
            self.create_self()
            self.set_version(client_version)
        else:
            self.version = self.get_version()
            if str(self.version) != str(client_version) and not ignore_version:
                raise ConfigError, "It seems the database '%s' was generated when your client was at version %s,\
                                    however, your client now is at version %s. Which means this database file\
                                    cannot be used with this client anymore and needs to be upgraded to the\
                                    version %s :/"\
                                            % (self.db_path, self.version, client_version, client_version)


    def get_version(self):
        try:
            return self.get_meta_value('version')
        except:
            raise ConfigError, "%s does not seem to be a database generated by anvio :/" % self.db_path


    def create_self(self):
        self.cursor.execute("CREATE TABLE self (key TEXT PRIMARY KEY, value TEXT)")
        self.cursor.execute("CREATE TABLE users (login TEXT PRIMARY KEY, firstname TEXT, lastname TEXT, email TEXT, password TEXT, path TEXT, token TEXT, accepted INTEGER, project TEXT)")
        self.cursor.execute("CREATE TABLE projects (name TEXT PRIMARY KEY, path TEXT, user TEXT)")
        self.cursor.execute("CREATE TABLE views (name TEXT PRIMARY KEY, project TEXT, public INTEGER, token TEXT)")
        self.conn.commmit()

    def set_version(self, version):
        self.set_meta_value('version', version)


    def set_meta_value(self, key, value):
        p = (key, value,)
        self.cursor.execute("INSERT INTO self VALUES(?,?)", p)
        self.conn.commit()


    def remove_meta_key_value_pair(self, key):
        p = (key, )
        self.cursor.execute("DELETE FROM self WHERE key=?", p)
        self.conn.commit()


    def get_meta_value(self, key):
        p = (key, )
        response = self.cursor.execute("SELECT value FROM self WHERE key=?", p)
        row = response.fetchone()
        
        if not row:
            raise ConfigError, "A value for '%s' does not seem to be set in table 'self'." % key

        val = row['value']

        if type(val) == type(None):
            return None

        try:
            val = int(val)
        except ValueError:
            pass

        return val

    def disconnect(self):
        self.conn.close()


    def create_user(self, firstname, lastname, email, login, password):
        # check if all arguments were passed
        if not (firstname and lastname and email and login and password):
            return (False, "You must pass a firstname, lastname, email login and password to create a user")

        # check if the login name is already taken
        p = (login, )
        response = self.cursor.execute('SELECT login FROM users WHERE login=?', p)
        row = response.fetchone()

        if row:
            return (False, "Login '%s' is already taken." % login)

        # calculate path
        path = hashlib.md5(login).hexdigest()

        # crypt password
        password = crypt.crypt(password, ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(2)))

        # generate token
        token = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(32))

        # set accepted to 'false'
        accepted = 0

        # create the user entry in the DB
        p = (firstname, lastname, email, login, password, path, token, accepted, )
        response = self.cursor.execute("INSERT INTO users (firstname, lastname, email, login, password, path, token, accepted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", p)
        self.conn.commit()

        # send the user a mail to verify the email account

        mail = mailsetup.mailsetup()
        
        # these vars need to come from the config
        anvioURL = "http://0.0.0.0:8080/";
        messageSubject = "anvio account request"
        messageText = "You have requested an account for anvio.\n\nClick the following link to activate your account:\n\n"+anvioURL+"confirm?code="+token+"&login="+login;

        mail.sendEmail(email, messageSubject, messageText)

        return (True, "User request created")

    def get_user_for_login(self, login):
        if not login:
            raise ConfigError, "You must pass a login to retrieve a user entry"

        p = (login, )
        response = self.cursor.execute("SELECT * FROM users WHERE login=?", p)
        user = response.fetchone()

        if user:
            # check if the user has a project set
            user = self.get_project(user)
        
        return user


    def get_user_for_token(self, token):
        if not token:
            raise ConfigError, "You must pass a token to retrieve a user entry"

        p = (token, )
        response = self.cursor.execute("SELECT * FROM users WHERE token=?", p)
        user = response.fetchone()

        if user:
            # check if the user has a project set
            user = self.get_project(user)
            return (True, user)
        else:
            return (False, 'invalid token')


    def accept_user(self, login, token):
        if not (login and token):
            raise ConfigError, "You must pass a login and a token to accept a user"

        p = (login, )
        response = self.cursor.execute("SELECT token, path FROM users WHERE login=?", p)
        row = response.fetchone()

        if not row:
            return(False, "No user found for login '%s'." % login)

        val = row['token']

        if val == token:
            self.cursor.execute("UPDATE users SET accepted=1 WHERE login=?", p)
            self.conn.commit()

            # create the user directory
            path = self.path + 'userdata/' + row['path']
            if not os.path.exists(path):
                os.makedirs(path)

            return (True, "User confirmed")
        else:
            return (False, "Invalid token for user '%s'." % login)


    def login_user(self, login, password):
        if not (login and password):
            raise ConfigError, "You must pass a login and a token to accept a user"

        # get the user from the db
        user = self.get_user_for_login(login)

        if not user:
            return (False, "login or password invalid")

        # verify the password
        valid = crypt.crypt(password, user['password']) == user['password']

        if not valid:
            return (False, "login or password invalid")

        # generate a new token
        token = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(32))
        token = login + token
        p = (token, login, )
        self.cursor.execute("UPDATE users SET token=? WHERE login=?", p)
        self.conn.commit()

        # check if the user has a project set
        user = self.get_project(user)

        # set the user token
        user["token"] = token

        return (True, user)

    def logout_user(self, login):
        if not login:
            raise ConfigError, "You must pass a login to log out a user"

        # get the user from the db
        user = self.get_user_for_login(login)

        if not user:
            return (False, "user not found")

        # remove the token from the DB
        p = (login, )
        self.cursor.execute("UPDATE users SET token='' WHERE login=?", p)
        self.conn.commit()

        return (True, None)

    def create_project(self, login, pname):
        if not login:
            raise ConfigError, "You must pass a login to create a project"
        if not pname:
            raise ConfigError, "You must pass a project name to create a project"
        user = self.get_user_for_login(login)

        if not user:
            return (False, "Could not find a user for login %s" % login)

        # create a path name for the project
        ppath = hashlib.md5(pname).hexdigest()
        path = self.path + 'userdata/' + user["path"] + '/' + ppath

        if not os.path.exists(path):
            os.makedirs(path)
            p = (pname, ppath, login, )
            response = self.cursor.execute("INSERT INTO projects (name, path, user) VALUES (?, ?, ?)", p)
            self.conn.commit()
            return (True, { "name": pname, "path": ppath, "user": login })
        else:
            return (False, 'You already have a project of that name')

    def get_project(self, user):
        if not user:
            raise ConfigError, "You must pass a user to retrieve their current project"

        if user['project']:
            p = (user['login'], user['project'], )
            response = self.cursor.execute("SELECT * FROM projects WHERE user=? AND name=?", p)
            project = response.fetchone()
            if project:
                user['project'] = project['name']
                user['project_path'] = project['path']


        # get all user project names
        p = (user['login'], )
        response = self.cursor.execute("SELECT name FROM projects WHERE user=?", p)
        projects = response.fetchall()
        pnames = []
        for row in projects:
            pnames.append(row['name'])
        user['project_names'] = pnames
        
        return user

    def set_project(self, login, pname):
        if not login:
            raise ConfigError, "You must pass a login to create a project"
        if not pname:
            raise ConfigError, "You must pass a project name to create a project"
        user = self.get_user_for_login(login)

        if not user:
            return (False, "Could not find a user for login %s" % login)

        # create a path name for the project
        ppath = hashlib.md5(pname).hexdigest()
        path = self.path + user["path"] + '/' + ppath
        
        p = (login, pname, )
        response = self.cursor.execute("SELECT * FROM projects WHERE user=? AND name=?", p)
        row = response.fetchone()
        
        if row:
            p = (pname, login, )
            self.cursor.execute("UPDATE users SET project=? WHERE login=?", p)
            self.conn.commit()
            return (True, 'project set')
        else:
            return (False, 'the user does not own this project')


    def delete_project(self, login, pname):
        if not login:
            raise ConfigError, "You must pass a login to create a project"
        if not pname:
            raise ConfigError, "You must pass a project name to create a project"
        user = self.get_user_for_login(login)

        if not user:
            return (False, "Could not find a user for login %s" % login)

        # create a path name for the project
        ppath = hashlib.md5(pname).hexdigest()
        path = self.path + user["path"] + '/' + ppath
        
        p = (login, pname, )
        response = self.cursor.execute("SELECT * FROM projects WHERE user=? AND name=?", p)
        row = response.fetchone()
        
        if row:
            p = (None, login, )
            self.cursor.execute("UPDATE users SET project=? WHERE login=?", p)
            p = (login, pname, )
            self.cursor.execute("DELETE FROM projects WHERE user=? AND name=? ", p)
            self.conn.commit()

            if os.path.exists(path):
                shutil.rmtree(path, ignore_errors=True)
            else:
                print path
            
            return (True, 'project deleted')
        else:
            return (False, 'the user does not own this project')

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
            
    return d
