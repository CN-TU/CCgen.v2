from scapy.layers.inet import IP


class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		assert len(mappedvalue) == 1 or len(mappedvalue) == 2

		if mappedvalue[0] == "0":
			pkt[IP].flags &= 0b011  # clear reserved flag
		elif mappedvalue[0] == "1":
			pkt[IP].flags |= 0b100  # set reserved flag

		if len(mappedvalue) == 2:
			if mappedvalue[1] == "0":
				pkt[IP].flags &= 0b101  # clear DF flag
			elif mappedvalue[1] == "1":
				pkt[IP].flags |= 0b010  # set DF flag

		return pkt

	def extract(self, pkt, params):
		return (pkt[IP].flags & 0b100) >> 2
