from scapy.layers.inet import IP, TCP, UDP
from scapy.packet import raw

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		#payload_before = pkt[IP].len
		pkt[IP].len = int(mappedvalue)+int(params['poff'])
		#payload_dif = pkt[IP].len - payload_before
		#pkt = IP(b''.join([raw(pkt),payload_dif*b'0']))
		return pkt

	def extract(self, pkt, params):
		return int(pkt[IP].len)-int(params['poff'])


