class Mapping():
	def __init__(self, mapping):

		self._data2mapping = {}
		self._mapping2data = {}
		self.bits = mapping.bits
		self.param = {}

		#map parameter
		for parameter in mapping.parameters:
			self.param.update({parameter.name : parameter.value})
		
		#value mapping
		param_number = 0
		for i in range(0, 2**self.bits):
			number_from = bin(i)[2:]
			while len(number_from) < self.bits: number_from = "0" + number_from
			number_to = str(i)

			#specify value mapping
			vm = [x.symbol_to for x in mapping.valuemappings if x.data_from == number_from]
			if len(vm) > 0: 
				number_to = vm[0]
				param_name = "p" + str(param_number)
				self.param.update({param_name : number_to})
				param_number += 1
			
			self._data2mapping[number_from] = number_to
			self._mapping2data[number_to] = number_from

	def getmapping(self, data):
		try:
			return self._data2mapping[data]
		except KeyError:
			return None #end of message

	def getdata(self, mapping):
		try:
			return self._mapping2data[mapping]
		except KeyError:
			raise Exception("Mapping %s not found in mapping %s" % (mapping, self._filename))

	def getparams(self):
		try:
			return self.param
		except KeyError:
			return None
