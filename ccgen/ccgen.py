#!/usr/bin/env python

from scapy.utils import PcapWriter, PcapReader
from scapy.layers.inet import IP, TCP, ICMP, UDP
from os import system

import util.config
import util.helper
import util.iptables

abort = False

def abortGeneration():
    global abort
    abort = True

def _process_online(config, callback):
    import socket
    import fnfqueue

    iprule = util.iptables.get_iprule(config)

    #REMOVE iptables rule just in case
    system('iptables -w -F ' + config.iptables_chain)
    print('iptables -w -F ' + config.iptables_chain)
    #APPLY iptables rule
    system(iprule)
    print(iprule)

    socket.SO_RCVBUFFORCE = 2*1024*1024

    conn = fnfqueue.Connection()
    
    try:
        q = conn.bind(config.iptables_queue)
        q.set_mode(0xffff, fnfqueue.COPY_PACKET)
    except PermissionError:
        print("Access denied; Do I have root rights or the needed capabilities?")
        return

    try:
        for packet in conn:
            scapypkt = IP(packet.payload)
            if callback(scapypkt): break
            packet.payload = bytes(scapypkt)
            packet.mangle()
    finally:
        system('iptables -w -F ' + config.iptables_chain)
        print('iptables -w -F ' + config.iptables_chain)
        conn.close()

def process_online_send(config):
    global modified_frames, params
    modified_frames = 0
    params = config.mapping.getparams()

    def callback(pkt):
        datagram = config.message.getdatagram()
        if not datagram: return True
        mappedvalue = config.mapping.getmapping(datagram)
        if mappedvalue:
            config.technique.modify(pkt, mappedvalue, params)

            del pkt[IP].chksum  #recalculate checksum
            if pkt.haslayer(TCP):
                del pkt[TCP].chksum
            if pkt.haslayer(ICMP):
                del pkt[ICMP].chksum

            global modified_frames
            modified_frames += 1
        else:
            pass
        if abort: return True
        return False

    _process_online(config, callback)
    return modified_frames

def process_online_receive(config):
    global checked_frames, params
    checked_frames = 0
    params = config.mapping.getparams()
    outputfile = open(config.output_file, 'w')

    def callback(pkt):
        received = config.technique.extract(pkt, params)
        data = config.mapping.getdata(str(received))
        if data:
            global checked_frames
            try:
                outputfile.write(data)
                outputfile.flush()
                checked_frames += 1
            except:
                pass
        if abort: return True
        return False

    _process_online(config, callback)
    return checked_frames

def process_offline_send(config):
    modified_frames = 0
    params = config.mapping.getparams()
    with PcapWriter(config.output_file) as outfile:
        for frame in PcapReader(config.input_file):
            if not util.should_filter_frame(config, frame):
                # Add covert channel
                datagram = config.message.getdatagram()
                mappedvalue = config.mapping.getmapping(datagram)
                
                if mappedvalue:
                    modified_frames += 1
                    if config.layer == 'IP' and not 'pIAT' in params:
                        config.technique.modify(frame[IP], mappedvalue, params)
                    else:
                        frame = config.technique.modify(frame, mappedvalue, params)

                    # Recalculate checksums
                    if not frame: continue

                    if frame.haslayer(TCP):
                        del frame[TCP].chksum
                    if frame.haslayer(UDP):
                        del frame[UDP].chksum
                    if frame.haslayer(ICMP):
                        del frame[ICMP].chksum
                    del frame[IP].chksum
            outfile.write(frame)
            if abort: break
    return modified_frames

def process_offline_receive(config):
    checked_frames = 0
    params = config.mapping.getparams()

    with open(config.output_file, 'w') as outfile:
        for frame in PcapReader(config.input_file):
            if not util.should_filter_frame(config, frame):
                checked_frames = checked_frames + 1
                if config.layer == 'IP' and not 'pIAT' in params:
                    mappedvalue = config.technique.extract(frame[IP], params)
                else:
                    mappedvalue = config.technique.extract(frame, params)
                if mappedvalue is None:
                    continue
                try:
                    data = ""
                    if 'pIAT' in params and isinstance(mappedvalue, str):
                        for value in mappedvalue: data += config.mapping.getdata(str(value))
                    else: data = config.mapping.getdata(str(mappedvalue))
                    outfile.write(data)
                except:
                    pass
            if abort: break
    return checked_frames

def process_summary(modus, config, frames):
    print("\n[Modus]", modus[1])
    result = "failed"
    if modus[0] == 1:
        required_pkts = config.message.necessary_packets()   
        if required_pkts == frames:
            print("  SUCCEEDED!!")
            result = "succeeded"
            comment = "SUCCEEDED!!<br>"
        else:
            print("  FAILED!!")
            comment = "FAILED!!<br>"
        comment += "Required packets: " + str(required_pkts) + "<br>Modified packets: " + str(frames) 
        print("  Required packets: ", required_pkts)    
        print("  Modified packets: ", frames)
    elif modus[0] == 2:
        text = util.helper.bin2text(None, config.output_file)
        if len(text.strip()) == 0: 
            result = "failed"
            comment = "FAILED!!<br>Configured covert channel could not be found!"
            print("  FAILED!!")
        else:
            result = "succeeded"
            comment = "SUCCEEDED!!<br>Inscpected packets: " + str(frames) + "<br>Check obtained message in " + config.output_file + " file."
            print("  SUCCEEDED!!")
            print("  Inspected packets: ", frames)
            print("  Check obtained message in " + config.output_file + " file.")
    elif modus[0] == 3:
        required_pkts = config.message.necessary_packets()    
        if required_pkts == frames:
            print("  SUCCEEDED!!")
            result = "succeeded"
            comment = "SUCCEEDED!!<br>"
        else:
            print("  FAILED!!")
            comment = "FAILED!!<br>"
        comment += "Required packets: " + str(required_pkts) + "<br>Modified packets: " + str(frames)
        print("  Required packets: ", required_pkts)    
        print("  Modified packets: ", frames)   
    elif modus[0] == 4:
        text = util.helper.bin2text(None, config.output_file)
        if len(text.strip()) == 0: 
            result = "failed"
            comment = "FAILED!!<br>Configured covert channel could not be found!"
            print("  FAILED!!")
        else:
            result = "succeeded"
            comment = "SUCCEEDED!!<br>Inscpected packets: " + str(frames) + "<br>Check obtained message in " + config.output_file + " file."
            print("  SUCCEEDED!!")
            print("  Inspected packets: ", frames)
            print("  Check obtained message in " + config.output_file + " file.") 

    if abort: 
        result = "aborted"
        comment = comment.replace("FAILED", "ABORTED") 
        comment = comment.replace("SUCCEEDED", "ABORTED")
    return [result, comment]    

def generateCovertChannel(user_config, message, direction, network):
    global abort
    abort = False
    config = util.config.parse_config(user_config, message, direction, network)
    
    frames = 0
    if network == util.config.NETWORK_ONLINE:
        if direction == util.config.DIRECTION_SEND:
            frames = process_online_send(config)
            modus = (1,'ONLINE INJECTION...')
        elif direction == util.config.DIRECTION_RECEIVE:
            frames = process_online_receive(config)
            modus = (2,'ONLINE EXTRACTION...')
    elif network == util.config.NETWORK_OFFLINE:
        if direction == util.config.DIRECTION_SEND:
            frames = process_offline_send(config)
            modus = (3,'OFFLINE INJECTION...')
        elif direction == util.config.DIRECTION_RECEIVE:
            frames = process_offline_receive(config)
            modus = (4,'OFFLINE EXTRACTION...')

    util.helper.makeFileAccessible(network, config.output_file)
    return process_summary(modus, config, frames)

