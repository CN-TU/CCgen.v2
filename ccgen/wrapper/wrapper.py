from pathlib import Path
import os
import numpy as np
import pandas as pd

PATH_TO_GOFLOWS = str(Path(__file__).parent.absolute()) + "/go-flows-master/go-flows"
WRP_UTILS_FOLDER = str(Path(__file__).parent.absolute()) + "/utils"
WRP_TEMP_FOLDER = str(Path(__file__).parent.absolute()) + "/temp"

d1 = None
d2 = None
d3 = None
d4 = None
d5 = None

def goflowsExists():
    return Path(PATH_TO_GOFLOWS).is_file()

def extract_stats(inpcap):
    global d1, d2, d3, d4, d5

    str_to_run = PATH_TO_GOFLOWS + " run features " + WRP_UTILS_FOLDER + "/1tup.json export csv " + WRP_TEMP_FOLDER + "/1tup.csv source libpcap " + inpcap
    os.system(str_to_run)
    str_to_run = PATH_TO_GOFLOWS + " run features " + WRP_UTILS_FOLDER + "/2tup.json export csv " + WRP_TEMP_FOLDER + "/2tup.csv source libpcap " + inpcap
    os.system(str_to_run)
    str_to_run = PATH_TO_GOFLOWS + " run features " + WRP_UTILS_FOLDER + "/3tup.json export csv " + WRP_TEMP_FOLDER + "/3tup.csv source libpcap " + inpcap
    os.system(str_to_run)
    str_to_run = PATH_TO_GOFLOWS + " run features " + WRP_UTILS_FOLDER + "/4tup.json export csv " + WRP_TEMP_FOLDER + "/4tup.csv source libpcap " + inpcap
    os.system(str_to_run)
    str_to_run = PATH_TO_GOFLOWS + " run features " + WRP_UTILS_FOLDER + "/5tup.json export csv " + WRP_TEMP_FOLDER + "/5tup.csv source libpcap " + inpcap
    os.system(str_to_run)

    d1 = pd.read_csv(WRP_TEMP_FOLDER + "/1tup.csv") 
    d2 = pd.read_csv(WRP_TEMP_FOLDER + "/2tup.csv") 
    d3 = pd.read_csv(WRP_TEMP_FOLDER + "/3tup.csv") 
    d4 = pd.read_csv(WRP_TEMP_FOLDER + "/4tup.csv") 
    d5 = pd.read_csv(WRP_TEMP_FOLDER + "/5tup.csv") 

def removeConversationFromLists(sel):
    global d1, d2, d3, d4, d5
    fields = ['sourceIPAddress','destinationIPAddress','protocolIdentifier','sourceTransportPort','destinationTransportPort']
    key = len([element for element in sel.columns if element in fields])
    
    if key == 1:
        val1 = sel.iloc[0]['sourceIPAddress']
        d1 = d1[d1['sourceIPAddress'] != val1]
        d2 = d2[d2['sourceIPAddress'] != val1]
        d3 = d3[d3['sourceIPAddress'] != val1]
        d4 = d4[d4['sourceIPAddress'] != val1]
        d5 = d5[d5['sourceIPAddress'] != val1]
    elif key == 2:
        val1 = sel.iloc[0]['sourceIPAddress']
        val2 = sel.iloc[0]['destinationIPAddress']
        d1 = d1[d1['sourceIPAddress'] != val1]
        d2 = d2[(d2['sourceIPAddress'] != val1) | (d2['destinationIPAddress'] != val2)]
        d3 = d3[(d3['sourceIPAddress'] != val1) | (d3['destinationIPAddress'] != val2)]
        d4 = d4[(d4['sourceIPAddress'] != val1) | (d4['destinationIPAddress'] != val2)]
        d5 = d5[(d5['sourceIPAddress'] != val1) | (d5['destinationIPAddress'] != val2)]
    elif key == 3:
        val1 = sel.iloc[0]['sourceIPAddress']
        val2 = sel.iloc[0]['destinationIPAddress']
        val3 = sel.iloc[0]['protocolIdentifier']
        d1 = d1[d1['sourceIPAddress'] != val1]
        d2 = d2[(d2['sourceIPAddress'] != val1) | (d2['destinationIPAddress'] != val2)]
        d3 = d3[(d3['sourceIPAddress'] != val1) | (d3['destinationIPAddress'] != val2) | 
            (d3['protocolIdentifier'] != val3)]
        d4 = d4[(d4['sourceIPAddress'] != val1) | (d4['destinationIPAddress'] != val2) ]
        d5 = d5[(d5['sourceIPAddress'] != val1) | (d5['destinationIPAddress'] != val2) | 
            (d5['protocolIdentifier'] != val3)]
    elif key == 4:
        val1 = sel.iloc[0]['sourceIPAddress']
        val2 = sel.iloc[0]['destinationIPAddress']
        val4 = sel.iloc[0]['sourceTransportPort']
        val5 = sel.iloc[0]['destinationTransportPort']
        d1 = d1[d1['sourceIPAddress'] != val1]
        d2 = d2[(d2['sourceIPAddress'] != val1) | (d2['destinationIPAddress'] != val2)]
        d3 = d3[(d3['sourceIPAddress'] != val1) | (d3['destinationIPAddress'] != val2)]
        d4 = d4[(d4['sourceIPAddress'] != val1) | (d4['destinationIPAddress'] != val2) | 
            (d4['sourceTransportPort'] != val4) | (d4['destinationTransportPort'] != val5)]
        d5 = d5[(d5['sourceIPAddress'] != val1) | (d5['destinationIPAddress'] != val2) | 
            (d5['sourceTransportPort'] != val4) | (d5['destinationTransportPort'] != val5)]
    elif key == 5:
        val1 = sel.iloc[0]['sourceIPAddress']
        val2 = sel.iloc[0]['destinationIPAddress']
        val3 = sel.iloc[0]['protocolIdentifier']
        val4 = sel.iloc[0]['sourceTransportPort']
        val5 = sel.iloc[0]['destinationTransportPort']
        d1 = d1[d1['sourceIPAddress'] != val1]
        d2 = d2[(d2['sourceIPAddress'] != val1) | (d2['destinationIPAddress'] != val2)]
        d3 = d3[(d3['sourceIPAddress'] != val1) | (d3['destinationIPAddress'] != val2) | 
            (d3['protocolIdentifier'] != val3)]
        d4 = d4[(d4['sourceIPAddress'] != val1) | (d4['destinationIPAddress'] != val2) | 
            (d4['sourceTransportPort'] != val4) | (d4['destinationTransportPort'] != val5)]
        d5 = d5[(d5['sourceIPAddress'] != val1) | (d5['destinationIPAddress'] != val2) | 
            (d5['sourceTransportPort'] != val4) | (d5['destinationTransportPort'] != val5) | (d5['protocolIdentifier'] != val3)]
    
def getFilters(config, req_pkts):
    if config['flowkey'] == "1tup":
        dfst = d1
    elif config['flowkey'] == "2tup":
        dfst = d2
    elif config['flowkey'] == "3tup":
        dfst = d3
    elif config['flowkey'] == "4tup":
        dfst = d4
    else:
        dfst = d5

    # required packets + 1 (taking into account ctc) and only ipv4 addresses
    dfst_small = dfst[(dfst['packetTotalCount'] > req_pkts) & ~(dfst['sourceIPAddress'].str.contains(':'))]

    if config['constraints'] == 'tcp':
        dfst_small = dfst_small[(dfst_small['protocolIdentifier'] == 6)] 
    elif config['constraints'] == 'udp':
        dfst_small = dfst_small[(dfst_small['protocolIdentifier'] == 17)] 
    elif config['constraints'] == 'tcp/udp':
        dfst_small = dfst_small[(dfst_small['protocolIdentifier'] == 17) | (dfst_small['protocolIdentifier'] == 6)] 
    elif config['constraints'] == 'tls':
        dfst_small = dfst_small[(dfst_small['mode(destinationTransportPort)'] == 443)] 

    filters = {}
    if len(dfst_small) > 0:
        sel = dfst_small.sample()
        
        filters['src_ip'] = (sel['sourceIPAddress'].to_numpy())[0]
        filters['src_port'] = None
        filters['dst_ip'] = None
        filters['dst_port'] = None
        filters['proto'] = None

        removeConversationFromLists(sel)

        if config['flowkey'] != "1tup":
            filters['dst_ip'] = sel['destinationIPAddress'].to_numpy()[0]
            if config['flowkey'] == "3tup":
                filters['proto'] = int(sel['protocolIdentifier'].to_numpy()[0])
            elif config['flowkey'] == "4tup":
                filters['src_port'] = int(sel['sourceTransportPort'].to_numpy()[0]) 
                filters['dst_port'] = int(sel['destinationTransportPort'].to_numpy()[0])      
            elif config['flowkey'] == "5tup":
                filters['proto'] = int(sel['protocolIdentifier'].to_numpy()[0])         
                filters['src_port'] = int(sel['sourceTransportPort'].to_numpy()[0])
                filters['dst_port'] = int(sel['destinationTransportPort'].to_numpy()[0])
        return filters
    return None