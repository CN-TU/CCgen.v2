from scapy.layers.inet import IP

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		pkt[IP].id = int(mappedvalue)*256
		pkt[IP].flags &= 0b101  # clear DF flag
		return pkt

	def extract(self, pkt, params):
		return int(pkt[IP].id/256)
