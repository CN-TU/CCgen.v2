var isWrapper = false;
var config = null;

$(document).ready(function () {
    document.getElementById('configfile').addEventListener('change', handleFileSelect, false);
});

function handleFileSelect(event) {
    const reader = new FileReader()
    reader.onload = handleFileLoad;
    reader.readAsText(event.target.files[0])
}

function handleFileLoad(event) {
    config = JSON.parse(event.target.result);
    //validate config
    if (config == {} || !config) {
        $("#configfile").addClass('is-invalid');
        $("#configfile").removeClass('is-valid');
    } else {
        //TODO validate it more in detail
        $("#configfile").removeClass('is-invalid');
        $("#configfile").addClass('is-valid');

        if (config.hasOwnProperty('configs')) {
            isWrapper = true;
            $('#editBtn').addClass("d-none");
        } else {
            isWrapper = false;
            $('#editBtn').removeClass("d-none");
        }
        if (config.hasOwnProperty('flowkey')) $('#sendBtn').addClass("d-none");
        else $('#sendBtn').removeClass("d-none");
    }
}

function closeModal() {
    $('#configsummary').hide();
    $('.modal-body').html('');
    $('#sendBtn').show();
}

function sendConfig() {
    var url = "/addTask";
    if (isWrapper) url = "/processWrapper";

    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(config),
        contentType: 'application/json'
    }).done(function () {
        window.location.replace("/");
    });
}

function loadConfig() {
    localStorage.setItem("config", JSON.stringify(config));
    window.location.replace("/configurator");
}

function validateInputFile() {
    //validate
    if (!($('#configfile').hasClass('is-valid'))) {
        $("#configfile").addClass('is-invalid');
        $("#configfile").removeClass('is-valid');
        return;
    }

    //open summary
    $('#configsummary').show();

    if (isWrapper) {
        $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Files]</b></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Input file:&nbsp;</b></p><p class="text-left w-50"> ' + config['input_file'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Output file:&nbsp;</b></p><p class="text-left w-50"> ' + config['output_file'] + '</p></div>');
        for (var i = 0; i < config['configs'].length; i++) {
            $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Config ' + (i + 1).toString() + ']</b></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message type:&nbsp;</b></p><p class="text-left w-50"> ' + config.configs[i]['message']['active'] + '</p></div>');
            if (config['configs'][i].message.active == "text") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + config.configs[i]['message']['message'] + '</p></div>');
            else if (config['configs'][i].message.active == "link") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + config.configs[i]['message']['message_link'] + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Outfile type:&nbsp;</b></p><p class="text-left w-50"> ' + config.configs[i]['outfiletype'] + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Flow key:&nbsp;</b></p><p class="text-left w-50"> ' + config.configs[i]['flowkey'] + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Constraints:&nbsp;</b></p><p class="text-left w-50"> ' + config.configs[i]['constraints'] + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Repetition:&nbsp;</b></p><p class="text-left w-50"> ' + config.configs[i]['repetition'].toString() + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><b>Mapping:</b></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Id:&nbsp;</b></p><p class="text-left"> ' + config.configs[i]['mapping']['id'] + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Name:&nbsp;</b></p><p class="text-left"> ' + config.configs[i]['mapping']['name'] + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Technique:&nbsp;</b></p><p class="text-left"> ' + config.configs[i]['mapping']['technique'] + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Layer:&nbsp;</b></p><p class="text-left"> ' + config.configs[i]['mapping']['layer'] + '</p></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Bits:&nbsp;</b></p><p class="text-left"> ' + config.configs[i]['mapping']['bits'] + '</p></div>');
            for (var j = 0; j < config.configs[i]['mapping']['valuemappings'].length; j++) {
                if (j == 0) $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>&emsp;[Value mappings]</b></div>');
                $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Value mapping ' + (j + 1).toString() +
                    ':&nbsp;</b></p><div class="d-flex w-15"><p class="text-left"><b>Id:</b> ' + config.configs[i]['mapping']['valuemappings'][j]['id'] +
                    '</p></div><p><b>' + config.configs[i]['mapping']['valuemappings'][j]['data_from'] + '</b> -> ' + config.configs[i]['mapping']['valuemappings'][j]['symbol_to'] + '</p></div>');
            }
            for (var j = 0; j < config.configs[i]['mapping']['parameters'].length; j++) {
                if (j == 0) $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>&emsp;[Parameters]</b></div>');
                $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>&emsp;Parameter ' + (i + 1).toString() +
                    ':&nbsp;</b></p><div class="d-flex w-15"><p class="text-left"><b>Id:</b> ' + config.configs[i]['mapping']['parameters'][j]['id'] +
                    '</p></div><div class="d-flex w-25"><p class="text-left"><b>Name:</b> ' + config.configs[i]['mapping']['parameters'][j]['name'] +
                    '</p></div><div class="d-flex w-15"><p class="text-left"><b>Value:</b> ' + config.configs[i]['mapping']['parameters'][j]['value'] +
                    '</p></div></div>');
            }
        }
    } else {
        $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Config & Files]</b></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Id:&nbsp;</b></p><p class="text-left"> ' + config['id'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Network:&nbsp;</b></p><p class="text-left"> ' + config['network'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Direction:&nbsp;</b></p><p class="text-left"> ' + config['direction'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Name:&nbsp;</b></p><p class="text-left w-50"> ' + config['name'] + '</p></div>');
        if (config.network == "offline") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Input file:&nbsp;</b></p><p class="text-left w-50"> ' + config['input_file'] + '</p></div>');
        if (config.network == "offline") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Output file:&nbsp;</b></p><p class="text-left w-50"> ' + config['output_file'] + '</p></div>');
        if (config.direction == "inject" && config.message.active == "text") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + config.message.message + '</p></div>');
        if (config.direction == "inject" && config.message.active == "link") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message:&nbsp;</b></p><p class="text-left w-50"> ' + config.message.message_link + '</p></div>');
        if (config.direction == "inject") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Message type:&nbsp;</b></p><p class="text-left w-50"> ' + config.message.active + '</p></div>');
        $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Filters]</b></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Source IP Address:&nbsp;</b></p><p class="text-left"> ' + config['src_ip'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Source Port:&nbsp;</b></p><p class="text-left"> ' + config['src_port'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Destination IP Address:&nbsp;</b></p><p class="text-left"> ' + config['dst_ip'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Destination Port:&nbsp;</b></p><p class="text-left"> ' + config['dst_port'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Protocol:&nbsp;</b></p><p class="text-left"> ' + config['proto'] + '</p></div>');
        if (config.network == "online") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>IP tables chain:&nbsp;</b></p><p class="text-left"> ' + config['iptables_chain'] + '</p></div>');
        if (config.network == "online") $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>IP tables queue:&nbsp;</b></p><p class="text-left"> ' + config['iptables_queue'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Channel & Mapping]</b></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Id:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['id'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Mapping:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['name'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Technique:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['technique'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Layer:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['layer'] + '</p></div>');
        $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Bits:&nbsp;</b></p><p class="text-left"> ' + config['mapping']['bits'] + '</p></div>');
        for (var i = 0; i < config['mapping']['valuemappings'].length; i++) {
            if (i == 0) $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Value mappings]</b></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Value mapping ' + (i + 1).toString() +
                ':&nbsp;</b></p><div class="d-flex w-15"><p class="text-left"><b>Id:</b> ' + config['mapping']['valuemappings'][i]['id'] +
                '</p></div><p><b>' + config['mapping']['valuemappings'][i]['data_from'] + '</b> -> ' + config['mapping']['valuemappings'][i]['symbol_to'] + '</p></div>');
        }
        for (var i = 0; i < config['mapping']['parameters'].length; i++) {
            if (i == 0) $('.modal-body').append('<div class="d-flex mt-2 mb-1"><b>[Parameters]</b></div>');
            $('.modal-body').append('<div class="d-flex"><p class="w-30 text-left"><b>Parameter ' + (i + 1).toString() +
                ':&nbsp;</b></p><div class="d-flex w-15"><p class="text-left"><b>Id:</b> ' + config['mapping']['parameters'][i]['id'] +
                '</p></div><div class="d-flex w-25"><p class="text-left"><b>Name:</b> ' + config['mapping']['parameters'][i]['name'] +
                '</p></div><div class="d-flex w-15"><p class="text-left"><b>Value:</b> ' + config['mapping']['parameters'][i]['value'] +
                '</p></div></div>');
        }
    }
}