from scapy.layers.inet import IP
import random

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		aux = random.randint(-int(params['pvar']), int(params['pvar']))
		pkt[IP].ttl = int(mappedvalue)+aux
		return pkt

	def extract(self, pkt, params):
		base_vals = [int(params['p0']), int(params['p1'])]
		val = int(pkt[IP].ttl)
		aux = min(base_vals, key = lambda x: abs(x-val))
		return aux
