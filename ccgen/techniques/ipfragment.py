from scapy.layers.inet import IP

# This technique file implements the covert channel within the fragment offset
# fragment offset is a 13-bit field

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		pkt[IP].frag = int(mappedvalue)
		pkt[IP].flags &= 0b101  # clear DF flag
		pkt[IP].flags |= 0b001  # set MF flag
		return pkt

	def extract(self, pkt, params):
		return pkt[IP].frag
