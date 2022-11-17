from scapy.layers.inet import IP, TCP, UDP
from scapy.packet import raw
import random

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		aux = random.randint(-int(params['pvar']), int(params['pvar']))*int(params['pinc'])
		#payload_before = pkt[IP].len
		pkt[IP].len = int(mappedvalue)+aux
		#payload_dif = pkt[IP].len - payload_before
		#pkt = IP(b''.join([raw(pkt),payload_dif*b'0']))
		return pkt

	def extract(self, pkt, params):
		#return int(pkt[IP].len)-int(params['poff'])
		base_vals = [int(params['p0']), int(params['p1'])]
		val = int(pkt[IP].len)
		aux = min(base_vals, key = lambda x: abs(x-val))
		return aux


