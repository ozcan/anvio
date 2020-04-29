# -*- coding: utf-8
# pylint: disable=line-too-long
""" TO DO """

import os
import sys
import json

import anvio
import anvio.db as db
import anvio.terminal as terminal
from anvio.tables.miscdata import TableForLayerOrders
from anvio.dbops import PanSuperclass, get_item_orders_from_db

progress = terminal.Progress()
run = terminal.Run()
pp = terminal.pretty_print


class GenomeViewer(PanSuperclass):
    def __init__(self, args, run=run, progress=progress):

        self.run = run
        self.progress = progress
        self.args = args
        self.mode = 'genome'

        PanSuperclass.__init__(self, self.args)

        A = lambda x: args.__dict__[x] if x in args.__dict__ else None
        self.pan_db_path = A('pan_db')
        self.genomes_storage_path = A('genomes_storage')
        self.gene_callers_id = A('gene_callers_id')
        self.layers_order_data_dict = TableForLayerOrders(self.args).get()

        self.genome_name = None
        self.gene_callers_id = None


    def get_neighbors(self):
        pan_db = db.DB(self.pan_db_path, anvio.__pan__version__)
        genome_storage = db.DB(self.genomes_storage_path, anvio.__genomes_storage_version__)

        genome_filter_query = 'genome_name LIKE "%s"' % self.genome_name if self.genome_name else '1=1'
        gene_filter_query = 'gene_caller_id LIKE "%s"' % str(self.gene_callers_id) if self.gene_callers_id else '1=1'

        gene_cluster_row = pan_db.get_some_rows_from_table_as_dict(
            'gene_clusters', '%s and %s' % (genome_filter_query, gene_filter_query))

        gene_cluster_id = next(iter(gene_cluster_row.values()))['gene_cluster_id']

        genes_in_cluster = pan_db.get_some_rows_from_table_as_dict(
            'gene_clusters', gene_filter_query)

        genes = []
        clusters = {}
        contigs = {}

        for entry_id, entry in genes_in_cluster.items():
            if not entry['gene_cluster_id'] in clusters:
                clusters[entry['gene_cluster_id']] = []

            gene_callers_id = entry['gene_caller_id']
            genome_name = entry['genome_name']
            clusters[entry['gene_cluster_id']].append({'genome_name': genome_name,
                                                       'gene_callers_id': gene_callers_id})


            target_gene = genome_storage.get_some_rows_from_table_as_dict(
                'genes_in_contigs', 'genome_name LIKE "%s" and gene_callers_id LIKE "%s"' % (genome_name, str(gene_callers_id)))
            target_gene = target_gene[gene_callers_id]

            contig_info = genome_storage.get_some_rows_from_table_as_dict(
                'contigs_basic_info', 'genome_name LIKE "%s" and contig LIKE "%s"' % (genome_name, target_gene['contig']))

            if not genome_name in contigs:
                contigs[genome_name] = {}

            if not target_gene['contig'] in contigs[genome_name]:
                contigs[genome_name][target_gene['contig']] = contig_info[target_gene['contig']]

            neighbors = genome_storage.get_some_rows_from_table_as_dict('genes_in_contigs', 'genome_name LIKE "%s" AND contig LIKE "%s"' % (genome_name, target_gene['contig']))

            for gene_callers_id in neighbors:
                neighbors[gene_callers_id]['gene_callers_id'] = gene_callers_id

            genes.extend(neighbors.values())

        return {
            'genes': genes,
            'clusters': clusters,
            'contigs': contigs,
            'layers_orders': self.layers_order_data_dict
            }
