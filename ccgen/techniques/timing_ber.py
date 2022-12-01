from time import sleep

class CovertChannel():
    def __init__(self, online, config, message):
        self._online = online
        self._lasttime = None

    def modify(self, pkt, mappedvalue, params):
        if not self._lasttime:
            if not self._online: self._lasttime = pkt.time
        else:
            if self._online: sleep(float(self._lastmapping))
            else:
                residual = pkt.time - round(pkt.time, int(params['pmask']))
                self._lasttime += float(self._lastmapping) + residual
                pkt.time = self._lasttime
        self._lastmapping = float(mappedvalue)
        return pkt

    def extract (self, pkt, params):
        diff = None
        if self._lasttime: diff = float(round(pkt.time - self._lasttime, int(params['pmask'])))
        self._lasttime = pkt.time
        return diff
