from scapy.layers.inet import IP, TCP, UDP
from scapy.layers.tls import *
from scapy.all import load_layer

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		load_layer("tls") 
		if pkt.haslayer(TLS):
		    pkt[TLS][0].len = int(mappedvalue)+int(params['poff'])
		return pkt

	def extract(self, pkt, params):
		if pkt.haslayer(TLS):
			return int(pkt[TLS][0].len)-int(params['poff'])


