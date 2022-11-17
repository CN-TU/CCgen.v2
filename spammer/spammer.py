#!/usr/bin/python3

import config_spammer
import random
import time
import socket
import sys

METHODS = {'tcp': socket.SOCK_STREAM, 'udp': socket.SOCK_DGRAM}
config = config_spammer.Config("/vagrant/spammer.ini")

def rangeOrInt(x):
    if not '-' in str(x):
        return int(x)
    a, b = x.split('-')
    return random.randrange(int(a), int(b))

print('Started')
restart = True
while restart:
    restart = False

    for instruction in config.instructions:
        if instruction.mode.lower() == "tcp" or instruction.mode.lower() == "udp":
            method = METHODS[instruction.mode.lower()]
            sourcehost = instruction.src_ip
            sourceport = int(instruction.src_port) if instruction.src_port else 0
            pattern = bytearray.fromhex(instruction.pattern[2:])
            packets = rangeOrInt(instruction.packets)
            repeat = rangeOrInt(instruction.repeat)
            destination = (config.target, int(instruction.dst_port))            

            try:
                s = socket.socket(socket.AF_INET, method)
                s.bind((sourcehost, sourceport))
                if method == socket.SOCK_STREAM:
                    s.connect(destination)
                    # set TCP_NODELAY to disable nagle so packets don't get merged
                    s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                    for i in range(packets):
                        s.sendall(pattern*rangeOrInt(repeat))
                        time.sleep(0.1)
                if method == socket.SOCK_DGRAM:
                    for i in range(packets):
                        s.sendto(pattern*rangeOrInt(repeat), destination)
                        time.sleep(0.01)
                s.close()
            except socket.error:
                print("Connection failure ({} {} -> {}). Is the listener running?".format(instruction.mode, (sourcehost, sourceport), destination), file=sys.stderr)
                sys.exit(-1)
        elif instruction.mode == 'restart':
            restart = True
            continue
        elif instruction.mode == 'wait':
            if '-' in str(instruction.duration):
                a, b = instruction.duration.split('-')
                time.sleep(random.uniform(float(a), float(b)))
            else:
                time.sleep(float(instruction.duration))
