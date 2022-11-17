#!/usr/bin/python3

from pathlib import Path
import config_listener
import socket
import select

config =  config_listener.Config(str(Path(__file__).parent.parent.absolute()) + "/spammer/spammer.ini").listenerConfig
METHODS = {'tcp': socket.SOCK_STREAM, 'udp': socket.SOCK_DGRAM}

# dictionary with fileno -> (socket, function)
# fileno is the filen of the socket object and function
# the function to call when an event occured
sockets = {}
poll = select.poll()

# udp receive event
# just reads available data
def udp(conn, fileno, event):
    try:
        conn.recv(4096)
    except socket.error:
        pass

# tcp receive event
# closes connection on error/hup/EOF and reads available data
def tcp(conn, fileno, event):
    if event & select.POLLIN:
        try:
            data = conn.recv(4096)
        except socket.error:
            pass
    if data == '' or event & select.POLLHUP or event & select.POLLERR:
        poll.unregister(fileno)
        conn.close()
        del sockets[fileno]

# tcp accept event
# accepts connection, registers event handler and adds socket to sockets
def accept(conn, fileno, event):
    n = conn.accept()[0]
    n.setblocking(0)
    sockets[n.fileno()] = (n, tcp)
    poll.register(n.fileno(), select.POLLIN | select.POLLHUP | select.POLLERR)

# parse config, open sockets and register sockets for events
for instruction in config.instructions:
    method = METHODS[instruction.method.lower()]
    port = instruction.dst_port
    s = socket.socket(socket.AF_INET, method)
    s.bind(('', int(port)))
    if method == socket.SOCK_STREAM:
        s.listen(1)
    s.setblocking(0)
    if method == socket.SOCK_STREAM:
        sockets[s.fileno()] = (s, accept)
    if method == socket.SOCK_DGRAM:
        sockets[s.fileno()] = (s, udp)
    poll.register(s.fileno(), select.POLLIN)

# main event loop
print("Running...")
while True:
    events = poll.poll()
    for fd, event in events:
        conn, fun = sockets[fd]
        fun(conn, fd, event)