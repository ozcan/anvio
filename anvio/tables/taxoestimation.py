# -*- coding: utf-8
# pylint: disable=line-too-long

import os
import hashlib

import anvio
import anvio.db as db
import anvio.tables as t
import anvio.utils as utils
import anvio.terminal as terminal
import anvio.filesnpaths as filesnpaths

from anvio.errors import ConfigError
from anvio.drivers.hmmer import HMMer
from anvio.tables.tableops import Table
from anvio.parsers import parser_modules
from anvio.dbops import ContigsSuperclass
from anvio.tables.genecalls import TablesForGeneCalls


__author__ = "Developers of anvi'o (see AUTHORS.txt)"
__copyright__ = "Copyleft 2015-2018, the Meren Lab (http://merenlab.org/)"
__credits__ = []
__license__ = "GPL 3.0"
__version__ = anvio.__version__
__maintainer__ = "A. Murat Eren"
__email__ = "a.murat.eren@gmail.com"
__status__ = "Development"


blast_hits_table_name                    = 'blast_hits'
blast_hits_table_structure               = ['match_id' , 'gene_callers_id', 'gene_name', 'taxon_id', 'pourcentage_identity', 'bitscore']
blast_hits_table_types                   = ['text'     ,       'text'    ,      'text'   ,   'text'   ,     'text'   ,         'text']


taxonomy_estimation_bin_name             = 'taxonomy_estimation_bin'
taxonomy_estimation_bin_structure        = ['entry_id', 'collection_name', 'bin_name', 'source'  , 't_domain', "t_phylum", "t_class", "t_order", "t_family", "t_genus", "t_species"]
taxonomy_estimation_bin_types            = [ 'numeric',   'text'   ,        'text'  ,  'text',      'text',   'text'  ,  'text'  ,  'text'  ,  'text'   ,  'text'  ,   'text'   ]

taxonomy_estimation_metagenome_name      = 'taxonomy_estimation_metagenome'
taxonomy_estimation_metagenome_structure = ['gene_caller_id',      'gene_name',  'source' , 't_domain', "t_phylum", "t_class", "t_order", "t_family", "t_genus", "t_species"]
taxonomy_estimation_metagenome_types     = [ 'numeric',             'text'    ,  'text',      'text'  ,   'text'  ,  'text'  ,  'text'   ,  'text'  ,  'text'  ,   'text'   ]


run = terminal.Run()
progress = terminal.Progress()
pp = terminal.pretty_print

class TablesForTaxoestimation(Table):
    def __init__(self, db_path, run=run, progress=progress):

        self.db_path = db_path
        self.run = run
        self.progress = progress

        utils.is_contigs_db(self.db_path)

        Table.__init__(self, self.db_path, anvio.__contigs__version__, self.run, self.progress)


    def add_diamond_result_to_congigs(self):

        for line_hit in [line.split('\t') for line in diamond_output[1].split('\n')[1:-2]]:

            entries=[tuple([match_id,int(line_hit[0]),diamond_output[0],line_hit[1],line_hit[2],line_hit[11]])]

            self.database._exec_many('''INSERT INTO %s VALUES (?,?,?,?,?,?)''' % t.blast_hits_table_name, entries)
            match_id+=1
            taxo=[tuple([line_hit[1]]+list(self.taxonomy_dict[line_hit[1]].values()))]



    def add_diamond_result_to_congigs(self):
        print()
