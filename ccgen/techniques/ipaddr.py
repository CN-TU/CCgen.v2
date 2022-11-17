from scapy.layers.inet import IP

class CovertChannel():
	def __init__(self, online, config, message):
		pass

	def modify(self, pkt, mappedvalue, params):
		val = int(mappedvalue)+int(params['pmin'])         
		pkt[IP].dst = params['pdst']+str(val)
		return pkt

	def extract(self, pkt, params):
		val = int(pkt[IP].dst.split('.')[3])-int(params['pmin'])
		if val >=0:
			return val
		else:
			return 0
