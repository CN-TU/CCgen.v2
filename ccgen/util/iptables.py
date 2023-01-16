
def get_iprule(config):
	#TODO: ALLOW port ranges to be specified
	iprule = [config.iptables_chain]

	if config.src_ip:
		iprule.append("-s %s" % config.src_ip)
	if config.dst_ip:
		iprule.append("-d %s" % config.dst_ip)
	if config.proto:
		iprule.append("-p %s" % config.proto)
	if config.src_port:
		iprule.append("--sport %s" % config.src_port)
	if config.dst_port:
		iprule.append("--dport %s" % config.dst_port)

	iprule.append("-j NFQUEUE --queue-num %d" % config.iptables_queue)

	return "iptables -w -I " + " ".join(iprule)
