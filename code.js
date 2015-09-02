require.config({ baseUrl: '/' });

require(["docson/docson", "lib/jquery"], function(docson) {

    docson.templateBaseUrl = '/docson';

    function formatCode(json, $node) {
        Rainbow.color(json, 'javascript', function (highlightedJson) {
            $node.html('<pre><p data-language="javascript">' +
                highlightedJson + '</pre>');
        });
    }

    function wsResult(json, $responseNode, apiToken) {
        var tokenProvided = apiToken && apiToken.trim().length;
        var ws = new WebSocket('wss://ws.binary.com/websockets/v2');

        ws.onopen = function(evt) {
            var authorizeReq = '{"authorize":"' + apiToken + '"}';
            if (tokenProvided) ws.send(authorizeReq);
            ws.send(JSON.stringify(json));
        };

        ws.onmessage = function(msg) {
           var json = JSON.parse(msg.data);
           console.log(json); // intended to help developers, not for debugging, do not remove
           formatCode(JSON.stringify(json, null, 2), $responseNode);
        };
    }

    function issueRequestAndDisplayResult($this, requestUrl) {
        $this.html('<div class="progress"></div>');
        $.get(requestUrl, function(requestJson) {
            wsResult(requestJson, $this);
        });
    }

    function loadAndDisplaySchema($node, schemaUrl) {
        $.get(schemaUrl, function(schema) {
            docson.doc($node, schema);
        });
    }

    function loadAndFormatJson($node, jsonUrl) {
        $.get(jsonUrl, function(exampleJson) {
            formatCode(JSON.stringify(exampleJson, null, 2), $node);
            $node.show();
        }).fail(function() {
            $node.hide();
        });
    }

    function loadAndEditJson($node, jsonUrl) {
        $.get(jsonUrl, function(exampleJson) {
            $node.text(JSON.stringify(exampleJson, null, 2));
        });
    }

    function updatePlaygroundResponse() {
        var $response = $('#playground-response'),
            json;

        try {
            json = JSON.parse($('#playground-request').val());
        } catch(err) {
            alert('Not valid json!');
            return;
        }

        $response.html('<code><div class="progress"></div></code>');
        wsResult(json, $response, $('#api-token').val());
    }

    $('[data-schema]').each(function() {
        var $this = $(this);
        loadAndDisplaySchema($this, $this.attr('data-schema'));
    });

    $('#api-call-selector, #api-version-selector').on('change', function() {
        var verStr = $('#api-version-selector').val(),
            apiStr = $('#api-call-selector').val(),
            urlPath = '/config/' + verStr + '/' + apiStr + '/',
            requestSchemaUrl = urlPath + 'send.json',
            responseSchemaUrl = urlPath + 'receive.json',
            exampleJsonUrl = urlPath + 'example.json';
        loadAndDisplaySchema($('#playground-req-schema'), requestSchemaUrl);
        loadAndDisplaySchema($('#playground-res-schema'), responseSchemaUrl);
        if ($('#playground-example').length) {
            loadAndFormatJson($('#playground-example'), exampleJsonUrl);
        }
        if ($('#playground-request').length) {
            loadAndEditJson($('#playground-request'), exampleJsonUrl);
        }
        if ($('#api-example-response')) {
            issueRequestAndDisplayResult($('#api-example-response'), exampleJsonUrl);
        }
    });

    $('[data-example]').each(function() {
        var $this = $(this);
        loadAndDisplayJson($this, $this.attr('data-example'))
    });

    $('[data-response]').each(function() {
        var $this = $(this);
        issueRequestAndDisplayResult($this, $this.attr('data-response'));
    });

    $('#playground-btn').on('click', function() {
        updatePlaygroundResponse();
    });

    $('.open-in-playground').on('click', function() {
        window.location.href='/playground?=' + $this.attr('data-example');
    });

    $(function() {
        var apiPageStrIdx = window.location.href.indexOf('/api/#');
        if (!~apiPageStrIdx) return;

        var apiToDisplay = window.location.href.substr(apiPageStrIdx + 6);
        $('#api-call-selector').val(apiToDisplay).change();
    });
});