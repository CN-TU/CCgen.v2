from scapy.layers.inet import TCP, UDP
import random

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify (self, pkt, mappedvalue, params):
		aux = random.randint(-int(params['pvar']), int(params['pvar']))
		if pkt.haslayer(TCP):
			pkt[TCP].sport = int(mappedvalue)+aux
		elif pkt.haslayer(UDP):
			pkt[UDP].sport = int(mappedvalue)+aux
		return pkt

	def extract (self, pkt, params):
		base_vals = [int(params['p0']), int(params['p1'])]
		if pkt.haslayer(TCP):
			val = int(pkt[TCP].sport)
			aux = min(base_vals, key = lambda x: abs(x-val))
			return aux
		elif pkt.haslayer(UDP):
			val = int(pkt[UDP].sport)
			aux = min(base_vals, key = lambda x: abs(x-val))
			return aux
		else:
			return None

