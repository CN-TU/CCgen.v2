from scapy.layers.inet import IP

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		pkt[IP].tos = int(mappedvalue)*4 # skip 2 lsb bits
		return pkt

	def extract (self, pkt, params):
		return int(pkt[IP].tos/4)
