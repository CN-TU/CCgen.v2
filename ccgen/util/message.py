import itertools
from util.helper import text2bin

class Message():
	def __init__(self, message, n, params):
		self.message = message
		self.bin_message = text2bin(message)
		if "pSB" in params: self.bin_message = "1" + self.bin_message #add start bit
		self._message = self.cycle(self.bin_message)
		self._n = n		

	def getdatagram (self):
		# get the next n bits and wrap around
		return "".join(itertools.islice(self._message, self._n))

	def cycle(self, iterable):
		# returns bits of a message one by one. When the message ends, return None
		for element in iterable:
			yield element

	def necessary_packets (self):
		# get the number of necessary packets to transmit the whole message
		return int(len(self.bin_message)/self._n)
