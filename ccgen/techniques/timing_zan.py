class CovertChannel():
    def __init__(self, online, config, message):
        if online: raise Exception('Online mode not implemented!')
        self._lasttime = None
        self._lastmapping = None

    def modify(self, pkt, mappedvalue, params):
        if not self._lastmapping: self._lastmapping = mappedvalue  
        elif mappedvalue == self._lastmapping:
            if mappedvalue == "0": pkt.time = self._lasttime + float(params['pA'])
            elif mappedvalue == "1": pkt.time = self._lasttime + float(params['pB'])
        elif mappedvalue != self._lastmapping:
            if mappedvalue == "0": pkt.time = self._lasttime + (float(params['pC'])-float(params['pB']))
            elif mappedvalue == "1": pkt.time = self._lasttime + (float(params['pC'])-float(params['pA']))
        self._lasttime = pkt.time
        return pkt

    def extract (self, pkt, params):
        if not self._lasttime: 
            self._lasttime = pkt.time
            self._secondpacket = True
            return None
        diff = round(float(pkt.time - self._lasttime), int(params['pMask']))
        self._lasttime = pkt.time
        data = ""
        if diff == round(float(params['pA']), int(params['pMask'])): data = "00"
        elif diff == round(float(params['pB']), int(params['pMask'])): data = "11"
        elif diff == round((float(params['pC'])-float(params['pA'])), int(params['pMask'])): data = "01"
        elif diff == round((float(params['pC'])-float(params['pB'])), int(params['pMask'])): data = "10"

        if self._secondpacket:
            self._secondpacket = False 
            return data
        elif data: return data[1]
        return None