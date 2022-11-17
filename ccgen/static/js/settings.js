var setting = {};
var settings = [];

$(document).ready(function () {
    $.get("/getSettings", function (data) {
        settings = JSON.parse(data);
        settings.forEach(function (s) {
            var name = s.name;
            if (s.active) name += " [active]";
            $('#settingSelector').append($('<option>', {
                value: s.id,
                text: name
            }));
        });
    });
    handleDirectionSelector($('#settingDirectionSelector')[0], true);
    handleNetworkSelector($('#settingNetworkSelector')[0], true);
    if ($('#settingDirectionSelector').val() == "inject") handleMessageSelector("text");
});

/* -------------- VALIDATIONS -------------- */

function setFileName(elem) {
    var message = "";
    var data = /^[a-z0-9_.@()-]+$/i.test(elem.value); 
    if (data && !setting.id) {
        $.get("/isConfigNameUnique", { 'name': elem.value, 'class' : "Setting" }, function (response) {
            data = JSON.parse(response);
            if (!data) message = "Setting with the same name already exists!";
            inputCallback(data, elem, message);
        });
    } else if (!data) message = "Invalid characters for config name!";
    inputCallback(data, elem, message);
}

function checkPath(elem) {
    var data = false;
    var message = "";
    if (elem.value == "") data = true;
    else {
        $.get("/isOutputFileValid", { 'path': elem.value }, function (response) {
            data = JSON.parse(response);
            if (!data) message = "Check output path. Could not find folder of output path!";
            inputCallback(data, elem, message);
        });
    }
    inputCallback(data, elem, message);    
}

function setCovertMessage(elem) {
    var message = "";
    var data = false;
    if (elem.value && ascii_regex.test(elem.value) || elem.value == "") data = true;
    else message = "Invalid characters detected. Only ASCII characters are allowed"
    inputCallback(data, elem, message);
}

function setIpAddress(elem) {
    var message = "";
    var data = false;
    if (!elem.value) {
        data = true;
        elem.value = null;
    } else {
        if (ipv4_regex.test(elem.value)) data = true;
        else message = "Invalid ip address! Enter IPv4 address.";
    }
    inputCallback(data, elem, message);
}

function setPort(elem) {
    var message = "";
    var data = false;
    if (!elem.value) elem.value = 0;
    var number = parseFloat(elem.value);
    if (Number.isInteger(number) && number >= 0 && number < 65536) data = true;
    if (elem.value == 0) elem.value = null;
    if (!data) message = "Invalid input. Number must be integer, greater than 0 and smaller than 65536! Set field to null by entering 0!";
    inputCallback(data, elem, message);
}

function setNullableInteger(elem, lower, upper) {
    var message = "";
    var data = false;
    if (!elem.value) elem.value = -1;
    var number = parseFloat(elem.value);
    if (Number.isInteger(number) && number >= lower && number < upper) data = true;
    if (elem.value == -1) elem.value = null;
    if (!data) message = "Invalid input. Number must be integer, greater than " + (lower + 1).toString() + " and smaller than " + upper.toString() + "! Set field to null by entering -1!";
    inputCallback(data, elem, "");
}

function inputCallback(data, elem, message) {
    if (data == true) {
        elem.classList.add("is-valid");
        elem.classList.remove("is-invalid");
        $(elem).attr('title', "Input valid!");
    } else {
        $(elem).attr('title', message);
        elem.classList.add("is-invalid");
        elem.classList.remove("is-valid");
    }
}

let ipv4_regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
let ascii_regex = /^[\x00-\x7F]*$/;

/* ------------ END VALIDATIONS ------------ */

/* --------------- SELECTORS --------------- */

function handleDirectionSelector(elem, reload = true) {
    var network = $('#settingNetworkSelector').val();
    var selected = elem.value;
    if (selected == "inject") {
        $('#settingmessage').parent().parent().show();
        $('#settingmessagelink').parent().parent().show();
        $('#settingMessageSelector').parent().parent().show();
        if (network == "online") $('#settingoutput').parent().parent().hide();
    } else {
        $('#settingmessage').parent().parent().hide();
        $('#settingmessagelink').parent().parent().hide();
        $('#settingMessageSelector').parent().parent().hide();
        $('#settingoutput').parent().parent().show();
    }
    if (reload) setSetting();
}

function handleNetworkSelector(elem, reload = true) {
    var selected = elem.value;
    if (selected == "online") {
        $('#settingiptablesqueue').parent().parent().show();
        $('#settinginput').parent().parent().hide();
        $('#settingoutput').parent().parent().hide();

        $('#settingsrcip')[0].parentElement.children[1].innerHTML = "Network is filtered after that source ip address";
        $('#settingsrcport')[0].parentElement.children[1].innerHTML = "Network is filtered after that source port";
        $('#settingdstip')[0].parentElement.children[1].innerHTML = "Network is filtered after that destination ip address";
        $('#settingdstport')[0].parentElement.children[1].innerHTML = "Network is filtered after that destination port";
        $('#settingproto')[0].parentElement.children[1].innerHTML = "Network is filtered after that ip protocol number";
    } else {
        $('#settingiptablesqueue').parent().parent().hide();
        $('#settinginput').parent().parent().show();
        $('#settingoutput').parent().parent().show();

        $('#settingsrcip')[0].parentElement.children[1].innerHTML = "Input pcap file is filtered after that source ip address";
        $('#settingsrcport')[0].parentElement.children[1].innerHTML = "Input pcap file is filtered after that source port";
        $('#settingdstip')[0].parentElement.children[1].innerHTML = "Input pcap file is filtered after that destination ip address";
        $('#settingdstport')[0].parentElement.children[1].innerHTML = "Input pcap file is filtered after that destination port";
        $('#settingproto')[0].parentElement.children[1].innerHTML = "Input pcap file is filtered after that ip protocol number";
    }
    if (reload) setSetting();
}

function handleSettingSelector() {
    $(':input', '#settingform')
        .not('select, :button, :submit, :reset, :hidden')
        .val(null)
        .removeClass('is-valid')
        .removeClass('is-invalid')
        .prop('checked', false)
        .prop('selected', false);

    setting = {};

    $('#settingform')[0].reset();
    $('#settingname').val('').trigger('change');
    $('#settinginput').addClass('is-valid');
    $('#settingoutput').addClass('is-valid');
    $('#settingsrcip').addClass('is-valid');
    $('#settingsrcport').addClass('is-valid');
    $('#settingdstip').addClass('is-valid');
    $('#settingdstport').addClass('is-valid');
    $('#settingproto').addClass('is-valid');
    $('#settingiptablesqueue').addClass('is-valid');
    $('#settingmessage').addClass('is-valid');
    $('#settingmessagelink').addClass('is-valid');
    if (!($('#activationBtn').hasClass("d-none"))) $('#activationBtn').addClass("d-none");

    var selected = $("#settingSelector").val();
    if (selected != "Create new setting") {
        s = settings.filter(set => set.id == selected)[0];
        setting = s;
        $('#settingname').val(s.name).trigger('change');
        $('#settinginput').val(s.input_file).trigger('change');
        $('#settingoutput').val(s.output_file).trigger('change');
        $('#settingNetworkSelector').val(s.network);
        $('#settingDirectionSelector').val(s.direction);
        $('#settingsrcip').val(s.src_ip).trigger('change');
        $('#settingsrcport').val(s.src_port).trigger('change');
        $('#settingdstip').val(s.dst_ip).trigger('change');
        $('#settingdstport').val(s.dst_port).trigger('change');
        $('#settingproto').val(s.proto).trigger('change');
        if (s.direction == "inject") $('#settingmessage').val(s.message.message).trigger('change');
        if (s.direction == "inject") $('#settingmessagelink').val(s.message.message_link).trigger('change');
        if (s.direction == "inject") $('#settingMessageSelector').val(s.message.active).trigger('change');
        $('#settingiptablesqueue').val(s.iptables_queue).trigger('change');

        handleNetworkSelector(document.getElementById("settingNetworkSelector"), false);
        handleDirectionSelector(document.getElementById("settingDirectionSelector"), false);

        if (!setting.active) $('#activationBtn').removeClass("d-none");
        else {
            if (!($('#activationBtn').hasClass("d-none"))) $('#activationBtn').addClass("d-none");
        }
    } else $('#activationBtn').addClass("d-none");
}

function handleMessageSelector(active) {
    if (active == "text") {
        $($('#settingmessage')[0].parentElement.parentElement.children[0]).removeClass('text-muted');
        $($('#settingmessagelink')[0].parentElement.parentElement.children[0]).addClass('text-muted');
    } else {
        $($('#settingmessagelink')[0].parentElement.parentElement.children[0]).removeClass('text-muted');
        $($('#settingmessage')[0].parentElement.parentElement.children[0]).addClass('text-muted');
    }
}

/* ------------- END SELECTORS ------------- */

/* ---------------- BUTTONS ---------------- */

function deleteSetting() {
    if (confirm('Are you sure you want to delete this setting (id=' + setting.id + ') from database?')) {
        if (setting.id) {
            $.ajax({
                type: "POST",
                url: "/deleteSetting",
                data: '{ "id" : "' + setting.id + '"}',
                contentType: 'application/json',
                success: function (data) {
                    $('#settingSelector option').each(function () {
                        if (!($(this).val() == 'Create new setting')) $(this).remove();
                    });
                    settings = JSON.parse(data);
                    settings.forEach(function (s) {
                        var name = s.name;
                        if (s.active) name += " [active]";
                        $('#settingSelector').append($('<option>', {
                            value: s.id,
                            text: name
                        }));
                    });
                    $('#settingSelector').val('Create new setting').trigger('change');
                }
            });
        }
    }
}

function activateSetting() {
    if (setting.id) {
        $.ajax({
            type: "POST",
            url: "/activateSetting",
            data: '{ "id" : "' + setting.id + '", "network" : "' + setting.network + '", "direction" : "' + setting.direction + '"}',
            contentType: 'application/json',
            success: function (data) {
                $('#settingSelector option').each(function () {
                    if (!($(this).val() == 'Create new setting')) $(this).remove();
                });
                settings = JSON.parse(data);
                settings.forEach(function (s) {
                    var name = s.name;
                    if (s.active) name += " [active]";
                    $('#settingSelector').append($('<option>', {
                        value: s.id,
                        text: name
                    }));
                });
                $('#settingSelector').val('Create new setting').trigger('change');
            }
        });
    } else console.log("Cannot activate new setting. Save first!")

}

function validateSetting() {
    //validate inputs
    var allinputscorrect = true;
    $('.form-control').each(function () {
        if ($(this)[0].localName == "input" && $(this).is(':visible') && !$(this).hasClass('is-valid')) {
            var message = $(this)[0].validationMessage ? $(this)[0].validationMessage : "Please fill out this field.";
            inputCallback(false, $(this)[0], message);
            allinputscorrect = false;
        }
    });

    if (!allinputscorrect) return;

    //collect data
    if (!setting.hasOwnProperty('id')) setting.id = null;
    setting.network = $('#settingNetworkSelector').val();
    setting.direction = $('#settingDirectionSelector').val();
    setting.name = $('#settingname').val();
    setting.input_file = $('#settinginput').val() ? $('#settinginput').val() : null;
    setting.output_file = $('#settingoutput').val() ? $('#settingoutput').val() : null;
    if (setting.direction == "extract") setting.message = null;
    else {
        if (!setting.hasOwnProperty('message')) setting.message = {};
        if (!setting.message.hasOwnProperty('id')) setting.message.id = '';
        setting.message.message = $('#settingmessage').val() ? $('#settingmessage').val() : null;
        setting.message.message_link = $('#settingmessagelink').val() ? $('#settingmessagelink').val() : null;
        setting.message.active = $('#settingMessageSelector').val();
    }   
    
    setting.src_ip = $('#settingsrcip').val() ? $('#settingsrcip').val() : null;
    setting.src_port = $('#settingsrcport').val() ? $('#settingsrcport').val() : null;
    setting.dst_ip = $('#settingdstip').val() ? $('#settingdstip').val() : null;
    setting.dst_port = $('#settingdstport').val() ? $('#settingdstport').val() : null;
    setting.proto = $('#settingproto').val() ? $('#settingproto').val() : null;
    setting.iptables_queue = setting.network == "online" && $('#settingiptablesqueue').val() ? $('#settingiptablesqueue').val() : null;

    //open summary inside modal
    $('#settingsummary').show();
    $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Config & Files]</b></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Id:&nbsp;</b></p><p class="text-left"> ' + setting['id'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Network:&nbsp;</b></p><p class="text-left"> ' + setting['network'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Direction:&nbsp;</b></p><p class="text-left"> ' + setting['direction'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Name:&nbsp;</b></p><p class="text-left w-50"> ' + setting['name'] + '</p></div>');
    if (setting.network == "offline") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Input file:&nbsp;</b></p><p class="text-left w-50"> ' + setting['input_file'] + '</p></div>');
    if (setting.network == "offline") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Output file:&nbsp;</b></p><p class="text-left w-50"> ' + setting['output_file'] + '</p></div>');
    if (setting.direction == "inject") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + setting.message.message + '</p></div>');
    if (setting.direction == "inject") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message Link:&nbsp;</b></p><p class="text-left w-50"> ' + setting.message.message_link + '</p></div>');
    if (setting.direction == "inject") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message Active:&nbsp;</b></p><p class="text-left w-50"> ' + setting.message.active + '</p></div>');
    $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Filters]</b></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Source IP Address:&nbsp;</b></p><p class="text-left"> ' + setting['src_ip'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Source Port:&nbsp;</b></p><p class="text-left"> ' + setting['src_port'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Destination IP Address:&nbsp;</b></p><p class="text-left"> ' + setting['dst_ip'] + '</p></div>');
    $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Destination Port:&nbsp;</b></p><p class="text-left"> ' + setting['dst_port'] + '</p></div>');
    if (setting.network == "online") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>IP tables queue:&nbsp;</b></p><p class="text-left"> ' + setting['iptables_queue'] + '</p></div>');
}

function sendSetting() {
    var data = JSON.stringify(setting);
    $.ajax({
        type: "POST",
        url: "/addSetting",
        data: data,
        contentType: 'application/json'
    }).done(function () {
        window.location.replace(window.location.href);
    });
}

function closeModal() {
    $('#settingsummary').hide();
    $('.modal-body').html('');
}

/* -------------- END BUTTONS -------------- */ 

/* -------------- HELPER FUNC -------------- */

function setSetting() {
    if ($('#settingSelector').val() != "Create new setting") {
        $.get("/getSetting", { 'network': $('#settingNetworkSelector').val(), 'direction': $('#settingDirectionSelector').val() }, function (data) {
            setting = JSON.parse(data);
            if (setting.id) {
                var name = setting.name;
                if (setting.active) name += " [active]";
                if (setting.id != $('#settingSelector').val()) $('#settingSelector').val(setting.id).trigger("change");
                else $('#settingSelector').val("Create new setting").trigger("change");
            } else $('#settingSelector').val("Create new setting").trigger("change");
        });
    } else $('#settingSelector').val("Create new setting").trigger("change");
}

/* ------------ END HELPER FUNC ------------ */