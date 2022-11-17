from scapy.layers.inet import IP, TCP, UDP
from scapy.all import load_layer

def find_transport(ip):
	if ip.haslayer(TCP):
		return TCP
	elif ip.haslayer(UDP):
		return UDP
	else:
		return None


def should_filter_frame(config, frame):
	if frame.haslayer(IP) == 0:
		return True

	ip = frame[IP]

	# filter ip
	if config.src_ip and ip.src != config.src_ip:
		return True
	if config.dst_ip and ip.dst != config.dst_ip:
		return True

	# filter protocol
	if config.proto and ip.proto != config.proto:
		return True

	transport = find_transport(ip)

	if transport:
		# filter ports
		if config.src_port and ip[transport].sport != config.src_port:
			return True
		if config.dst_port and ip[transport].dport != config.dst_port:
			return True

	if config.layer == 'TLS':
		load_layer("tls") 
		if frame.haslayer(TLS) == 0 or frame[TLS][0].type != 23:
			return True

	return False
