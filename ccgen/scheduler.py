from threading import Thread
from queue import Queue
from ccgen import generateCovertChannel, abortGeneration
from util.database import accessOrModifyDB
import datetime

q = Queue()
thread = None

def addToQueue(task):
    global thread, q
    q.put(task)
    if not thread:
        thread = Thread(target = scheduling)
        thread.start()

def abortCurrentTask():
    abortGeneration()

def scheduling():
    global thread, q
    while not q.empty():
        task = q.get()
        task = accessOrModifyDB("scheduler", "get", None, "Task", "id", task.id)
        if task and task.status == "canceled" or not task: continue
        task.date_started = datetime.datetime.now()
        task.status = "running"
        accessOrModifyDB("scheduler", "add", task, "Task")

        result, comment = generateCovertChannel(task.config, task.message, task.direction, task.network)
        
        task.date_finished = datetime.datetime.now()
        task.status = result
        task.comment = comment
        config_wrapper = task.config.wrapper_config
        config_id = task.config.id
        if (config_wrapper): task.config = None 

        accessOrModifyDB("scheduler", "add", task, "Task")
        if (config_wrapper): accessOrModifyDB("scheduler", "delete", None, "Config", "id", config_id )
    thread = None

