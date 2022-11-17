from scapy.layers.inet import IP, TCP, UDP
from scapy.packet import raw
from scapy.all import load_layer

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		load_layer("tls")
		#payload_before = pkt[IP].len
		pkt[TLS][0].len = int(mappedvalue)
		#payload_dif = pkt[IP].len - payload_before
		#pkt = IP(b''.join([raw(pkt),payload_dif*b'0']))
		return pkt

	def extract(self, pkt, params):
		return int(pkt[TLS][0].len)


