from time import sleep
"in",
class CovertChannel():
    def __init__(self, online, config, message):
        self._online = online
        self._firstpkt = 1
        self._lasttime = None

    def modify(self, pkt, mappedvalue, params):
        if self._firstpkt == 1:
            self._firstpkt = 0
            if not self._online == 1:
                self._lasttime = pkt.time
        else:
            if self._online == 1:
                sleep(float(self._lastmapping))
            else:
                residual = pkt.time - round(pkt.time, int(params['pmask']))
                pkt.time = self._lasttime + float(self._lastmapping) + residual
                self._lasttime = pkt.time

        self._lastmapping = float(mappedvalue)
        return pkt

    def extract (self, pkt, params):
        if self._lasttime is None:
            self._lasttime = pkt.time
            return

        ret = str(round(pkt.time - self._lasttime, int(params['pmask']))) 
        self._lasttime = pkt.time
        return ret
