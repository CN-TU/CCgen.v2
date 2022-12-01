class CovertChannel():
    def __init__(self, online, config, message):
        if online: raise Exception('Online mode not implemented!')
        self._lasttime = None
        self._lastvalue = None

    def modify(self, pkt, mappedvalue, params):
        if not self._lastvalue:
            self._lasttime = pkt.time
            self._incrementor = float(params['pTinc']) 
        elif self._lastvalue == "0": self._lasttime += float(params['pTb'])
        elif self._lastvalue == "1":
            self._lasttime += float(params['pTb']) + self._incrementor
            self._incrementor *= -1
        pkt.time = self._lasttime
        self._lastvalue = mappedvalue
        return pkt

    def extract (self, pkt, params):
        diff = None
        if self._lasttime: diff = round(float(pkt.time - self._lasttime), int(params['pmask']))
        self._lasttime = pkt.time
        if diff == round(float(params['pTb']), int(params['pmask'])): return "0"
        elif diff == round(float(params['pTb']) + float(params['pTinc']) , int(params['pmask'])): return "1"
        elif diff == round(float(params['pTb']) - float(params['pTinc']), int(params['pmask'])): return "1"
        return None