from scapy.layers.inet import TCP, UDP

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify (self, pkt, mappedvalue, params):
		if pkt.haslayer(TCP):
			pkt[TCP].sport = int(mappedvalue)+int(params['poff'])
		elif pkt.haslayer(UDP):
			pkt[UDP].sport = int(mappedvalue)+int(params['poff'])
		return pkt

	def extract (self, pkt, params):
		if pkt.haslayer(TCP):
			return int(pkt[TCP].sport)-int(params['poff'])
		elif pkt.haslayer(UDP):
			return int(pkt[UDP].sport)-int(params['poff'])
		else:
			return None
