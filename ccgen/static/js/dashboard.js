var instruction_no = 1;
var queue = [];
var history_list = [];

$(document).ready(function () {
    $('#stopVM').hide();
    $('#sshVM').hide();

    updateProcessView();

    $.get("isSuperUser", function (data) {
        var isSuperUser = JSON.parse(data);
        if (isSuperUser) statusVM();
        else disableVM();
    });

    setInterval(function () {
        $.get("/shallUpdateDashboardTables", function (data) {
            if (JSON.parse(data)) updateProcessView();
        });
    }, 200);    
});

/* -------------- VALIDATIONS -------------- */

function setIpAddress(elem) {
    var data = false;
    if (ipv4_regex.test(elem.value) || elem.value == "") data = true;
    inputCallback(data, elem);
}

function setPort(elem) {
    var data = false;
    if (elem.id == "instructionsrcport" && !elem.value) data = true;
    var number = parseFloat(elem.value);
    if (Number.isInteger(number) && number >= 0 && number < 65536) data = true;
    if (elem.value == 0) elem.value = null;
    inputCallback(data, elem);
}

function setPattern(elem) {
    var data = false;
    if (hex_regex.test(elem.value.substring(2))) data = true;
    inputCallback(data, elem);
}

function setNumberOrRange(elem) {    
    if (!elem.value) return;
    var data = null;
    if (elem.value.includes("-")) {
        var numbers = elem.value.split("-");
        numbers.forEach(function (n) {
            if (elem.id == "instructionduration") {
                if (isNaN(n) || parseFloat(n) < 0) data = false;
            } else {
                if (!(/^\+?(0|[1-9]\d*)$/.test(n))) data = false; 
            }
        });
        
    } else {
        if (elem.id == "instructionduration") {
            if (isNaN(elem.value) || parseFloat(elem.value) < 0) data = false;
        } else {
            if (!(/^\+?(0|[1-9]\d*)$/.test(elem.value))) data = false; 
        }           
    }
    if (data == null) data = true;
    inputCallback(data, elem);
}

function inputCallback(data, elem, message) {
    if (data == true) {
        elem.classList.add("is-valid");
        elem.classList.remove("is-invalid");
    } else {
        elem.classList.add("is-invalid");
        elem.classList.remove("is-valid");
    }
}

let ipv4_regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
let hex_regex = /[0-9A-Fa-f]{2}/;

/* ------------ END VALIDATIONS ------------ */

/* --------------- SELECTORS --------------- */

function handleModeSelector(elem) {
    var parentDiv = $(elem).parent().parent();
    if (elem.value == "restart") {
        parentDiv.children().hide();
    } else if (elem.value == "wait") {
        parentDiv.children().hide();
        parentDiv.find("#instructionduration").parent().show();
    } else {
        parentDiv.children().show();
        parentDiv.find("#instructionduration").parent().hide();
    }
    parentDiv.find('#deleteInstructionBtn').parent().parent().show();
    parentDiv.find("#instructionModeSelector").parent().show();
    parentDiv.find('#ino').parent().parent().show();
}

/* ------------- END SELECTORS ------------- */

/* ---------------- BUTTONS ---------------- */

function removeQueueEntry(elem){
    var index = parseInt(elem.parentElement.parentElement.parentElement.children[0].innerHTML)-1;
    task = queue[index];
    if (task.id) {
        $.ajax({
            type: "POST",
            url: "/abortTask",
            data: '{ "id" : "' + task.id + '"}',
            contentType: 'application/json',
            success: function (data) {
                updateProcessView(data);
                closeDetails();
            }
        });
    }    
}

function deleteHistoryEntry(elem) {
    var index = parseInt(elem.parentElement.parentElement.parentElement.children[0].innerHTML)-1;
    var task_id = history_list[index].id;
    if (task_id) {
        $.ajax({
            type: "POST",
            url: "/deleteTask",
            data: '{ "id" : "' + task_id + '"}',
            contentType: 'application/json',
            success: function (data) {
                updateProcessView(data);
                closeDetails();
            }
        });
    }
}

function showTaskDetails(elem) {
    var index = parseInt(elem.children[0].innerHTML)-1;
    var task = null;
    if (elem.parentElement.id == "queue-body") task = queue[index];
    else task = history_list[index]; 
    
    $('#infos').html('');

    if (task) {
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Id:</b></p><p class="text-left"> ' + task['id'] + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Date queued:</b></p><p class="text-left"> ' + task['date_created'] + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Date started:</b></p><p class="text-left"> ' + task['date_started'] + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Date finished:</b></p><p class="text-left"> ' + task['date_finished'] + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Network:</b></p><p class="text-left"> ' + task['network'] + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Direction:</b></p><p class="text-left"> ' + task['direction'] + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Config:</b></p><p class="text-left"> ' + task['config_name'] + '</p></div>');
        if (!task['config']) $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Wrapped config:</b></p><p class="text-left">true</p></div>');
        var max = 50;
        var message = task['message'];
        if (task['message'].length < 30) max = task['message'].length;
        else message = task['message'].slice(0,max) + "...";
        if (task['direction'] == "inject") $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:</b></p><p class="text-left w-50"> ' + message + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Result:</b></p><p class="text-left ' + getTextColorClass(task['status']) +'"> ' + task['status'] + '</p></div>');
        $('#infos').append('<div class="d-flex mt-2 mb-1"><b>[Details]</b></div>');
        if (task['network'] == "offline") $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Input file:</b></p><p class="text-left w-70"> ' + task['input_file'] + '</p></div>');
        if (task['network'] == "offline") $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Output file:</b></p><p class="text-left w-70"> ' + task['output_file'] + '</p></div>');
        if (task['config_file']) $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Config export:</b></p><p class="text-left w-70"> ' + task['config_file'] + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Mapping:</b></p><p class="text-left"> ' + task['mapping'] + '</p></div>');
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Technique:</b></p><p class="text-left"> ' + task['technique'] + '</p></div>');
        if (task['src_ip']) $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Source IP Address:</b></p><p class="text-left"> ' + task['src_ip'] + '</p></div>');
        if (task['src_port']) $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Source Port:</b></p><p class="text-left"> ' + task['src_port'] + '</p></div>');
        if (task['dst_ip']) $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Destinantion IP Address:</b></p><p class="text-left"> ' + task['dst_ip'] + '</p></div>');
        if (task['dst_port']) $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Destinantion Port:</b></p><p class="text-left"> ' + task['dst_port'] + '</p></div>');
        if (task['proto']) $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Protocol:</b></p><p class="text-left"> ' + task['proto'] + '</p></div>');
        if (task['network'] == "online") $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Ip tables chain:</b></p><p class="text-left w-70"> ' + task['iptables_chain'] + '</p></div>');
        if (task['network'] == "online") $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Ip tables queue file:</b></p><p class="text-left w-70"> ' + task['iptables_queue'] + '</p></div>');
        
        $('#infos').append('<div class="d-flex"><p class="w-30 text-left"><b>Comment:</b></p><p class="text-left text-secondary w-50"> ' + task['comment'] + '</p></div>');
    }
}

function closeDetails() {
    $('#infos').html('');
}

function statusVM() {
    $('#startVM').prop('disabled', false);
    $('#stopVM').prop('disabled', false);
    $('#sshVM').prop('disabled', false);
    $('#vm_status').html('initializing...');
    $('#vm_status').removeClass('text-success');
    setSpammerListener(null, null);
    $.get("/statusSpammerVM", function (d) {
        var data = JSON.parse(d);
        toggleBtns(data['status'], data['ip'], data['listener'], data['spammer']);
    });
}

function openConfigurator() {
    $('#configurator').show();
    $.get("/getSpammerConfig", function (d) {
        var data = JSON.parse(d);
        instruction_no = 1;
        $('#configdstip').val(data.target).trigger('change');
        data.instructions.forEach(function(instruction) {
            createInstruction(instruction, instruction_no.toString());
        });
    });
}

function disableVM() {
    $('#status_vm').prop('disabled', true);
    $('#config_vm').prop('disabled', true);
    $('#vm_ip').parent().css("visibility", "hidden");
    $('#startSpammerBtn').parent().css("visibility", "hidden");
    $('#startListenerBtn').parent().css("visibility", "hidden");
    $('#startVM').prop('disabled', true);
    $('#vm_status').html("sudo privileges needed");
}

function startVM() {
    if ($('#startVM').html() == "Restart") showTransitionStatus("rebooting...");
    else showTransitionStatus("booting...");
    $.get("/startSpammerVM", function (d) {
        var data = JSON.parse(d);
        toggleBtns(data['status'], data['ip'], data['listener'], data['spammer']);
    });       
}

function stopVM() {
    showTransitionStatus("shuting down...");
    $.get("/stopSpammerVM", function (d) {
        var data = JSON.parse(d);
        toggleBtns(data['status'], data['ip'], data['listener'], data['spammer']);
    }); 
}

function sshVM() {
    $.get("/sshSpammerVM", function (d) {
        var data = JSON.parse(d);
        if (!data['result']) alert("Could not open xterm console!");
    });
}

function startSpammerScript() {
    setSpammerListener(null, true);
    $.get("/startSpammerScript", function (d) {
        var data = JSON.parse(d);
        setSpammerListener(data['spammer'], data['listener']);
    });
}

function stopSpammerScript() {
    setSpammerListener(null, true);
    $.get("/stopSpammerScript", function (d) {
        var data = JSON.parse(d);
        setSpammerListener(data['spammer'], data['listener']);
    });
}

function startListenerScript() {
    setSpammerListener(false, null);
    $.get("/startListenerScript", function (d) {
        var data = JSON.parse(d);
        setSpammerListener(data['spammer'], data['listener']);
    });
}

function stopListenerScript() {
    setSpammerListener(false, null);
    $.get("/stopListenerScript", function (d) {
        var data = JSON.parse(d);
        setSpammerListener(data['spammer'], data['listener']);
    });
}

function createInstruction(instruction, no) {
    no = instruction_no;
    $('#instructions').append('<div class="instruction"><div><small>No</small><div class="d-flex align-items-center" style="height: 4vh;">' +
        '<h6 id="ino">' + no + '</h6></div> </div><div class="w-10"><small>Mode</small><select class="form-control" id="instructionModeSelector"' +
        'onchange="handleModeSelector(this)"><option>TCP</option><option>UDP</option><option>wait</option><option>restart</option></select>'+
        '</div><div class="w-22"><small>Src Ip</small><input type="text" class="form-control" id="instructionsrcip"onchange="setIpAddress(this)"' +
        '"></div><div class="w-14"><small>Src Port</small><input type="number" class="form-control" id="instructionsrcport" onchange="setPort(this)"' +
        '"></div><div class="w-14"><small>Dst Port</small><input type="number" class="form-control" id="instructiondstport" onchange="setPort(this)"' +
        '"></div><div class="w-10"><small>Pattern</small><input type="text" class="form-control" maxLength="4" value="0x" id="instructionpattern" onchange="setPattern(this)"' +
        '"></div><div class="w-15"><small>Packets</small><input type="text" class="form-control" id="instructionpackets" onchange="setNumberOrRange(this)"' +
        '"></div><div class="w-15"><small>Repeat</small><input type="text" class="form-control" id="instructionrepeat" onchange="setNumberOrRange(this)"' + 
        '"></div><div class="w-25"><small>Duration</small><input type="text" class="form-control" id="instructionduration" onchange="setNumberOrRange(this)"' +
        '"></div><div><small>&nbsp;</small><div class="d-flex align-items-center" style="height: 3vh;"><button type="button" class="btn btn-sm" title="Delete instruction"' +
        'id="deleteInstructionBtn" onclick="deleteInstruction(this)"><img width="15" src="/static/imgs/trash.svg"></button></div></div></div>');

    var instruction_div = $('#instructions').children().eq(parseInt(no)-1)[0];
    if (instruction && instruction_div) {        
        $(instruction_div.children[1].children[1]).val(instruction.mode).trigger('change');
        $(instruction_div.children[2].children[1]).val(instruction.src_ip).trigger('change');
        $(instruction_div.children[3].children[1]).val(instruction.src_port).trigger('change');
        $(instruction_div.children[4].children[1]).val(instruction.dst_port).trigger('change');
        $(instruction_div.children[5].children[1]).val(instruction.pattern).trigger('change');
        $(instruction_div.children[6].children[1]).val(instruction.packets).trigger('change');
        $(instruction_div.children[7].children[1]).val(instruction.repeat).trigger('change');
        $(instruction_div.children[8].children[1]).val(instruction.duration).trigger('change');
    } else {
        $(instruction_div.children[1].children[1]).val("TCP").trigger('change');
        $(instruction_div.children[2].children[1]).val("").trigger('change');
        $(instruction_div.children[3].children[1]).val("").trigger('change');
        $(instruction_div.children[4].children[1]).val("").trigger('change');
        $(instruction_div.children[5].children[1]).val("").trigger('change');
        $(instruction_div.children[6].children[1]).val("").trigger('change');
        $(instruction_div.children[7].children[1]).val("").trigger('change');
        $(instruction_div.children[8].children[1]).val("").trigger('change');     
    }         
    instruction_no++; 
}

function deleteInstruction(elem) {
    var no = elem.parentElement.parentElement.parentElement.children[0].children[1].children[0].innerHTML;    
    $('#instructions').children().eq(parseInt(no)-1).remove();
    var instructions = document.getElementById('instructions').children;
    for(var i = 0; i < instructions.length; i++) {
        instructions[i].children[0].children[1].children[0].innerHTML = ((i+1).toString());
    }
    instruction_no--;
}

function validateAndSendConfig() {
    //validate inputs
    var allinputscorrect = true;
    $('.form-control').each(function () {
        if ($(this)[0].localName == "input" && $(this).is(':visible') && !$(this).hasClass('is-valid')) {
            inputCallback(false, $(this)[0], "Please fill out this field.");
            allinputscorrect = false;
        }
    });

    if (!allinputscorrect) return;

    var config = {};
    config.target = $('#configdstip').val();
    config.instructions = [];
    var instructions = document.getElementById('instructions').children;
    for(var i = 0; i < instructions.length; i++) { 
        var instruction = {};
        instruction.mode = $(instructions[i].children[1].children[1]).val();
        instruction.src_ip = instruction.mode == "TCP" || instruction.mode == "UDP" ? $(instructions[i].children[2].children[1]).val() : null;
        instruction.src_port = instruction.mode == "TCP" || instruction.mode == "UDP" ? $(instructions[i].children[3].children[1]).val() : null;
        instruction.dst_port = instruction.mode == "TCP" || instruction.mode == "UDP" ? $(instructions[i].children[4].children[1]).val() : null;
        instruction.pattern = instruction.mode == "TCP" || instruction.mode == "UDP" ? $(instructions[i].children[5].children[1]).val() : null;
        instruction.packets = instruction.mode == "TCP" || instruction.mode == "UDP" ? $(instructions[i].children[6].children[1]).val() : null;
        instruction.repeat = instruction.mode == "TCP" || instruction.mode == "UDP" ? $(instructions[i].children[7].children[1]).val() : null;
        instruction.duration = instruction.mode == "wait" ? $(instructions[i].children[8].children[1]).val() : null;
        config.instructions.push(instruction);
    }
    
    //send config
    closeModal();
    var data = JSON.stringify(config);
    $.ajax({
        type: "POST",
        url: "/updateSpammerConfig",
        data: data,
        contentType: 'application/json'
    }).done(function (d) {
        var data = JSON.parse(d);
        setSpammerListener(data['spammer'], data['listener']);
    });
}

function closeModal() {
    $('#configurator').hide();
    $('.modal-body').html('');
}

/* -------------- END BUTTONS -------------- */ 

/* -------------- HELPER FUNC -------------- */

function updateProcessView() {
    $.get("/getTasks", function (data) {
        var q_number = 1;
        var h_number = 1;
        queue = [];
        history_list = [];
        $("#queue-body").html('');
        $("#history-body").html('');

        tasks = JSON.parse(data);
        tasks.forEach(function (task) {
            if (task.status == 'running' || task.status == "queued") {
                queue.push(task);
                addTableRow("#queue-body", q_number.toString(), task);
                q_number++;
            } else {
                history_list.push(task);
                addTableRow("#history-body", h_number.toString(), task);
                h_number++;
            }
        });
    });
}

function addTableRow(table, number, task) {
    var tablerow = '<tr class="clickable-row">' + 
        '<th scope="row">' + number + '</th>' +
        '<td>' + task.network + '</td>' +
        '<td>' + task.direction + '</td>' +
        '<td>' + task.config_name + '</td>' +
        '<td>' + task.mapping + '</td>' +
        '<td>' + task.date_created + '</td>' +
        '<td>' + task.date_started + '</td>';
    if (table == "#history-body") tablerow += '<td>' + task.date_finished + '</td>';
    tablerow += '<td class="' + getTextColorClass(task.status) +'">' + task.status + '</td>';
    var title = "Remove task from queue.";
    if (task.status == "running") title = "Abort task."
    if (table == "#queue-body") tablerow += '<td><div class="d-flex justify-content-center align-items-center">' +
    '<button type="button" class="btn btn-close mr-2" title="' + title + '" onclick="removeQueueEntry(this)"></button>' +
    '</div></td>'
    if (table == "#history-body") tablerow += '<td><div class="d-flex justify-content-center align-items-center">' +
        '<button type="button" class="btn btn-sm" title="Delete task in db." onclick="deleteHistoryEntry(this)"><img width="20" src="/static/imgs/trash.svg"></button>' +
        '</div></td>'
    tablerow += '</tr>';
    if (table == "#history-body") {
        $(table).prepend(tablerow);
        var tablerow = document.getElementById(table.slice(1)).children[0];
        tablerow.addEventListener('click', function() {
            showTaskDetails(tablerow);
        }, false);
    } 
    else {
        if (task.status == "running") {
            $(table).prepend(tablerow);
            tablerow = document.getElementById(table.slice(1)).children[0];
        } else {
            $(table).append(tablerow);
            tablerow = document.getElementById(table.slice(1)).children[number-1];
        }
        tablerow.addEventListener('click', function() {
            showTaskDetails(tablerow);
        }, false);
    }
}

function toggleBtns(vm_status, ip, listener_status, spammer_status) {
    //null -> error, false -> poweroff, true -> running    
    $('#vm_status').removeClass('text-info');
    $('#startVM').prop('disabled', false);
    $('#stopVM').prop('disabled', false);
    $('#sshVM').prop('disabled', false);
    if (vm_status) {
        $('#vm_status').html("running");
        $('#vm_status').addClass("text-success");
        $('#vm_ip').html(ip);
        $('#startVM').html('Restart');
        $('#startVM').show();
        $('#stopVM').show();
        $('#sshVM').show();
        setSpammerListener(spammer_status, listener_status);
    } else if (vm_status == false) {
        $('#vm_status').html("poweroff");
        $('#vm_status').addClass("text-dark");
        $('#vm_ip').html(ip);
        $('#startVM').html('Start');
        $('#startVM').show();
        $('#stopVM').hide();
        $('#sshVM').hide();
        setSpammerListener(spammer_status, listener_status);
    } else if (vm_status == null) {
        $('#vm_status').html('error');
        $('#vm_status').addClass('text-danger');
        $('#vm_ip').html(ip);
        $('#startVM').show();
        $('#stopVM').hide();
        $('#sshVM').hide();
        setSpammerListener(spammer_status, listener_status);
    }
}

function setSpammerListener(spammer, listener) {
    if (spammer == null) {
        $('#vm_spammer').html('loading...');
        $('#vm_spammer').removeClass('text-success');
        $('#vm_listener').removeClass('text-success');
        $('#startSpammerBtn').hide();
        $('#stopSpammerBtn').hide();
    }
    if (listener == null) {
        $('#vm_listener').html('loading...');
        $('#vm_listener').removeClass('text-success');
        $('#vm_spammer').removeClass('text-success');
        $('#startListenerBtn').hide();
        $('#stopListenerBtn').hide();
        if (spammer == false) $('#startSpammerBtn').hide();
    }
    if (listener == false)  {
        $('#vm_spammer').removeClass('text-success');
        $('#vm_spammer').html('stopped');
        $('#vm_listener').removeClass('text-success');
        $('#vm_listener').html('stopped');
        $('#startSpammerBtn').hide();
        $('#stopSpammerBtn').hide();
        $('#startListenerBtn').show();
        $('#startListenerBtn img').prop('src', '/static/imgs/play.svg')
        $('#stopListenerBtn').hide();
    } else if (listener == true) {
        $('#startListenerBtn').show();
        $('#stopListenerBtn').show();
        $('#startListenerBtn img').prop('src', '/static/imgs/arrow-counterclockwise.svg');
    
        $('#vm_listener').addClass('text-success');
        $('#vm_listener').html('running');

        if (spammer) {
            $('#vm_spammer').addClass('text-success');
            $('#vm_spammer').html('running');
            $('#startSpammerBtn img').prop('src', '/static/imgs/arrow-counterclockwise.svg');
            $('#stopSpammerBtn').show();
        } else if (spammer == false) {
            $('#vm_spammer').removeClass('text-success');
            $('#vm_spammer').html('stopped');
            $('#startSpammerBtn').show();
            $('#startSpammerBtn img').prop('src', '/static/imgs/play.svg');
            $('#stopSpammerBtn').hide();
        }
    }
}

function showTransitionStatus(status) {
    $('#startVM').prop('disabled', true);
    $('#stopVM').prop('disabled', true);
    $('#sshVM').prop('disabled', true);
    $('#vm_status').html(status);
    $('#vm_status').removeClass("text-success");
    $('#vm_status').removeClass("text-dark");
    $('#vm_status').removeClass('text-danger');
    $('#vm_status').addClass('text-info');
}

function getTextColorClass(status) {
    if (status == "succeeded") return "text-success";
    if (status == "queued") return "text-secondary";
    if (status == "running") return "text-info";
    if (status == "failed") return "text-danger";
    if (status == "aborted") return "text-warning";
    if (status == "canceled") return "text-warning";
    else return "";

}

/* ------------ END HELPER FUNC ------------ */