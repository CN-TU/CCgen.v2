from scapy.layers.inet import TCP

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		if pkt.haslayer(TCP):
			if not (pkt[TCP].flags & 0b0100000):
				pkt[TCP].urgptr = int(mappedvalue)
		return pkt

	def extract(self, pkt, params):
		if pkt.haslayer(TCP):
			if not (pkt[TCP].flags & 0b0100000):
				return int(pkt[TCP].urgptr)
		else:
			return None

