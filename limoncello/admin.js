$(function () {
    let args = locationArgs();
    if (args.page === "confirmSign" && typeof args.signId !== "undefined") {
        $("#confirmSign").show();
        $("#confirmSign > form").submit(function (e) {
            e.preventDefault();
            $("#confirmSign .error").html("");
            $("#confirmSign .info").html("Veuillez patienter, cela peut prendre jusqu'à quelques minutes.<br/><img class='loading_img' src='https://media.giphy.com/media/sSgvbe1m3n93G/giphy.gif' alt=''/>");
            $("#cfs_password").prop("disabled", true);
            $("#confirmSign input[type=submit]").prop("disabled", true);
            $.ajax({
                type: "POST",
                url: IP + "admin/sign",
                data: {
                    "signId": args.signId,
                    "password": $("#cfs_password").val()
                },
                dataType: "json",
                success: function (response) {
                    $("#confirmSign .info").html("Le document a été signé avec succès.");
                },
                error: function (x) {
                    $("#confirmSign .info").html("");
                    $("#cfs_password").prop("disabled", false);
                    $("#confirmSign input[type=submit]").prop("disabled", false);
                    if (x.status === 403) {
                        $("#confirmSign .error").html("Mot de passe incorrect.");
                    } else if (x.status === 404) {
                        $("#confirmSign .error").html("Une erreur est survenue. Utilisez-vous le lien obtenu par mail ?");
                    }
                }
            });
        });
    }
    else if (isAuth() && checkPerm("admin.access")) {
        if (typeof args.page === "undefined") {
            location.search = "?page=home";
        }
        if (args.page === "usermanage" && checkPerm("user.manage.list")) {
            $(".return_arrow").show();
            $(".return_arrow a").attr("href", "?page=home");
            $("#usermanage").show();
            $.ajax({
                type: "GET",
                url: IP + "user/list",
                data: sessioned({}),
                dataType: "json",
                success: function (response) {
                    for (let i = 0, c = response.length; i < c; ++i) {
                        $("#userlist").append("<tr><td>" + response[i].title[0] + "</td><td><a href='mailto:" + response[i].email + "'>" + response[i].email + "</a></td><td class='titlerole' id='titlerole_" + response[i].title[0] + "'>" + response[i].title[1].replace(/\n/g,"<br>") + "</td><td class='attrch' id='attrch_" + response[i].title[0] + "'>" + (response[i].attrs instanceof Array ? response[i].attrs.join(",") : "") + "</td></tr>");
                    }
                    if (checkPerm("user.manage.new")) {
                        $("#userlist").append("<tr><td colspan='4'><a href='?page=newuser' id='newuser'>⊕</a></td></tr>");
                    }
                    if (checkPerm("user.manage.attrs")){
                        $(".attrch").click(function(){
                            let td = this;
                            $(this).html("<input type='text' value=\""+$(this).text()+"\"/>");
                            let input = $("#"+this.id+" input").get()[0];
            
                            input.focus();
                            input.addEventListener("keydown",function(e){
                                if (e.keyCode === 13)
                                input.blur();
                            });
                            $(input).blur(function(){
                                $.ajax({
                                    type: "POST",
                                    url: IP + "user/attrs",
                                    data: sessioned({
                                        user: td.id.replace(/attrch_/,""),
                                        attrs: $(this).val().trim()
                                    }),
                                    dataType: "json",
                                    success: function (response) {
                                        $(td).html($(input).val().trim());
                                    }
                                });
                            });
                        });
                    }
                    if (checkPerm("user.manage.title.change")){
                        $(".titlerole").click(function(){
                            let td = this;
                            $(this).html("<textarea type='text'>"+$(this).text()+"</textarea>");
                            let input = $("#"+this.id+" textarea").get()[0];
                            input.focus();
                            $(input).blur(function(){
                                $.ajax({
                                    type: "POST",
                                    url: IP + "user/title",
                                    data: sessioned({
                                        username: td.id.replace(/titlerole_/,""),
                                        new: $(this).val().trim()
                                    }),
                                    dataType: "json",
                                    success: function (response) {
                                        $(td).html($(input).val().trim());
                                    }
                                });
                            });
                        });
                    }
                }
            });
        } else if (args.page === "home") {
            $("#home").show();
            if (checkPerm("user.manage.list")) {
                $("#hl_users").show();
            }
            if (checkPerm("admin.reg")) {
                $("#hl_acts").show();
            }
        } else if (args.page === "reg_new" && checkPerm("admin.reg")) {
            $(".return_arrow").show();
            $(".return_arrow a").attr("href", "?page=reg_home");
            function makeJson() {
                let maindic = { "content": [], "sign": {} };
                $(".rgn").each(function (i, v) {
                    maindic[v.id.replace(/rgn_/g, "")] = $(v).val().trim();
                });
                maindic["dispos"] = $("#rgn_dispos").val().split(/,?\s*\n+\s*/g);
                $(".rgn_content").each(function (i, v) {
                    if ($(v).hasClass("rgn_ntitle")) {
                        maindic["content"].push(["title", $(v).val()]);
                    } else if ($(v).hasClass("rgn_narticle")) {
                        maindic["content"].push(["article", $(v).val()]);
                    }
                });
                $(".rgn_signmention").each(function (i, v) {
                    let mentionValue = $(v).val().trim();
                    if (typeof maindic["sign"][mentionValue] === "undefined") {
                        maindic["sign"][mentionValue] = [];
                    }
                    maindic["sign"][mentionValue].push($("#rgn_signname" + v.id.replace(/rgn_signmention/, "")).val().trim());
                });
                return maindic;
            }
            if (typeof args.load !== "undefined" && typeof localStorage["adm_limoncello_regsave"] !== "undefined") {
                let saves = JSON.parse(typeof localStorage["adm_limoncello_regsave"] === "undefined" ? "{}":localStorage["adm_limoncello_regsave"]);
                if (typeof saves[args.load] !== "undefined") {
                    let toLoad = saves[args.load];
                    delete saves;
                    setTimeout(function () {

                        $("#rgn_type").val(toLoad.type);
                        $("#rgn_type").trigger("change");
                        $("#rgn_title").val(toLoad.title);
                        $("#rgn_preamble").val(toLoad.preamble);
                        if (typeof toLoad.dispos !== "undefined") {
                            $("#rgn_dispos").val(toLoad.dispos.join("\n"));
                        }
                        if (typeof toLoad.content !== "undefined") {
                            for (let i = 0, c = toLoad.content.length; i < c; i++) {
                                if (typeof toLoad.content[i].valueOf() === "string") {
                                    toLoad.content[i] = ["article", toLoad.content[i]];
                                }
                                if (toLoad.content[i][0] === "article") {
                                    $("#rgn_addarticle").trigger("click");
                                    $(".rgn_narticle").last().val(toLoad.content[i][1])
                                } else if (toLoad.content[i][0] === "title") {
                                    $("#rgn_addtitle").trigger("click");
                                    $(".rgn_ntitle").last().val(toLoad.content[i][1])
                                }
                            }

                        }
                        if (typeof toLoad.sign !== "undefined") {
                            for (let mention in toLoad.sign) {
                                for (let i = 0, c = toLoad.sign[mention].length; i < c; ++i) {
                                    $("#rgn_addsign").trigger("click");
                                    $(".rgn_signmention").last().val(mention);
                                    $(".rgn_signname").last().val(toLoad.sign[mention][i]);

                                }
                            }
                        }
                    }, 1);
                }
            }
            $("#reg_new").show();
            var preview = 1, counter = 0;
            $("#rgn_preview").click(function () {
                preview = 1;
                $("#rgn_publy").show();
            });
            $("#rgn_publy").click(function () {
                preview = 0;
            });
            $("#rgn_form").submit(function (e) {
                e.preventDefault();
                function main() {
                    let dic = makeJson();
                    $("#rgn_preview_bloc").show();
                    $("#rgn_preview_bloc > p").show();
                    $("#rgn_preview_bloc embed").remove();
                    $("#rgn_preview").prop("disabled", true);
                    $("#rgn_publy").prop("disabled", true);
                    location.href = "#rgn_preview_bloc";
                    $.ajax({
                        type: "POST",
                        url: IP + "admin/reg",
                        data: sessioned({
                            title: dic.title,
                            regtype: dic.type,
                            content: JSON.stringify(dic.content),
                            dispo: JSON.stringify(dic.dispos),
                            signs: JSON.stringify(dic.sign),
                            preview: preview.toString(),
                            preamble: dic.preamble

                        }),
                        dataType: "json",
                        success: function (response) {
                            $("#rgn_preview").prop("disabled", false);
                            $("#rgn_publy").prop("disabled", false);
                            $("#rgn_preview_bloc > p").hide();
                            if (preview) {
                                $("#rgn_preview_bloc > h2").show();
                                $("#rgn_preview_bloc").append("<embed src='" + IP + "file?sessionId=" + sessionStorage["limoncello-sessionId"] + "'></embed>");
                            } else {
                                $("#rgn_preview_bloc > h2").hide();
                                if (dic.sign === {}) {
                                    $("#rgn_preview_bloc > p").html(`Le document a bien été publié.<br>Le lien de téléchargement est
                                le suivant : <a href="https://github.com/mcmatthevan/mcmatthevan.github.io/raw/master/limoncello/reg/pdf/`+ response +
                                        `.pdf">https://github.com/mcmatthevan/mcmatthevan.github.io/raw/master/limoncello/reg/pdf/` + response +
                                        `.pdf</a><br/><br/>
                                Vous pourrez visualiser le document directement dans le navigateur d'ici quelques minutes à ce lien (partager celui-ci de préférence): 
                                <a href="https://mcmatthevan.github.io/limoncello/reg/pdf/`+ response +
                                        `.pdf">https://mcmatthevan.github.io/limoncello/reg/pdf/` + response +
                                        `.pdf</a>`);
                                } else {
                                    $("#rgn_preview_bloc > p").html(`Un exemplaire du document a été envoyé par mail aux personnes figurant
                                parmi les cosignataires. Vous serez averti par mail de la publication du document lorsque tous auront
                                confirmé leur signature.`)
                                }
                                $("#rgn_preview_bloc > p").show();
                                $("#rgn_publy").prop("disabled", true);
                            }
                            location.href = "#rgn_preview_bloc";
                        },
                        error: function () {
                            $("#rgn_preview_bloc > p").hide();
                            $("#rgn_preview_bloc").append("<p class='error'>Une erreur est survenue.</p>");
                            location.href = "#rgn_preview_bloc";
                        }
                    });
                }
                if (preview) {
                    $("#rgn_preview_bloc > p").html("Veuillez patienter.<br/><img class='loading_img' src='https://media.giphy.com/media/sSgvbe1m3n93G/giphy.gif' alt=''/>");
                    main();
                } else {
                    visualPrompt("Voulez-vous vraiment publier le document prévisualisé ?",["Oui","Non"],function (ch){
                        if (ch === "Oui"){
                            $("#rgn_preview_bloc > p").html("Veuillez patienter. <br/>La publication peut durer quelques minutes, ne fermez pas la fenêtre.<br/><img class='loading_img' src='https://media.giphy.com/media/sSgvbe1m3n93G/giphy.gif' alt=''/>");
                            main();
                        }
                    });
                }

            });

            let permType = {
                "Statut": "status",
                "Proposition de règlement": "propreg",
                "Règlement": "reg",
                "Acte": "acte"
            };
            for (let typ in permType) {
                if (checkPerm("admin.reg." + permType[typ])) {
                    $("#rgn_type").append("<option value=\"" + typ + "\">" + typ + "</option>");
                }
            }
            $("#rgn_type").change(function (e) {
                let value = $("#rgn_type option:selected").val();
                if (value === "") {
                    $("#rgn_tbody").hide();
                } else {
                    $("#rgn_tbody").show();
                    $("#rgn_sttitle").html(value + (value === "Statut" ? " n°XXXXX " : " "));
                    if (value === "Proposition de règlement") {
                        $(".rgn_notprop").hide();
                        $(".rgn_notprop textarea").prop("disabled", true);
                    } else {
                        $(".rgn_notprop").show();
                        $(".rgn_notprop textarea").prop("disabled", false);
                    }
                }
            });
            $("#rgn_addtitle").click(function (e) {
                $("#rgn_insert").before(`<tr class="unpersistent" id="rgn_ntitletr_` + counter + `"><td class="tag end"><span class="rgn_delete rgn_tdelete" id="rgn_tdelete` + counter + `">×</span>
                <label for="rgn_ntitle` + counter + `">Titre</label></td><td>:</td><td>
                    <input required type="text" class="rgn_content rgn_ntitle" id="rgn_ntitle` + counter + `"/>
                </td></tr>`);
                counter += 1;
                $(".rgn_tdelete").click(function (e) {
                    $("#rgn_ntitletr_" + this.id.replace(/rgn\_tdelete/g, "")).remove();
                });
            });
            $("#rgn_addarticle").click(function (e) {
                $("#rgn_insert").before(`<tr class="unpersistent" id="rgn_narticletr_` + counter + `"><td class="tag end"><span class="rgn_delete rgn_adelete" id="rgn_adelete` + counter + `">×</span>
                <label for="rgn_narticle` + counter + `">Article</label></td><td>:</td><td>
                    <textarea required type="text" class="rgn_content rgn_narticle" id="rgn_narticle` + counter + `"></textarea>
                </td></tr>`);
                counter += 1;
                $(".rgn_adelete").click(function (e) {
                    $("#rgn_narticletr_" + this.id.replace(/rgn\_adelete/g, "")).remove();
                });
            });
            $("#rgn_addsign").click(function (e) {
                $("#rgn_insert2").before(`<tr class="unpersistent" id="rgn_nsigntr_` + counter + `"><td class="tag end"><span class="rgn_delete rgn_sdelete" id="rgn_sdelete` + counter + `">×</span>
                <label for="rgn_nsign` + counter + `">Signature</label></td><td>:</td><td><table>
                    <tr><td class="end tag"><label for='rgn_signmention`+ counter + `'>Mention</label></td><td>:</td><td>
                        <select required id='rgn_signmention`+ counter + `' class='rgn_sign rgn_signmention'>
                            <option value="Par l'administrateur signataire">Par l'administrateur signataire</option>
                            <option value="Vu pour exécution">Vu pour exécution</option>
                        </select>
                    </td></tr>
                    <tr><td class="end tag"><label for='rgn_signname`+ counter + `'>Nom du signataire</label></td><td>:</td><td>
                    <input required type='text' id='rgn_signname`+ counter + `' class='rgn_sign rgn_signname'/></td></tr>
                </table></td></tr>`);
                counter += 1;
                $(".rgn_sdelete").click(function (e) {
                    $("#rgn_nsigntr_" + this.id.replace(/rgn\_sdelete/g, "")).remove();
                });
            });
            $("#rgn_save").click(function (e) {
                visualPrompt("Voulez-vous sauvegarder le brouillon de ce règlement ?<br>⚠ Celui-ci sera enregistré sur votre disque local.", ["Oui", "Non"], function (ch) {
                    if (ch === "Oui") {
                        if (typeof localStorage["adm_limoncello_regsave"] === "undefined") {
                            var regSaves = {};
                        } else {
                            var regSaves = JSON.parse(localStorage["adm_limoncello_regsave"])
                        }
                        let toSave = makeJson();
                        if (typeof args.load === "undefined") {
                            let type = toSave.type.replace(/\s+de\s+/g, " ").split(" ");
                            var id = "";
                            for (let i = 0, c = type.length; i < c; ++i) {
                                id += type[i].charAt(0).toUpperCase();
                            }
                            let date = new Date(),
                                nb = 0;
                            id += date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString() + "-";
                            while (typeof regSaves[id + nb] !== "undefined") {
                                nb += 1;
                            }
                            id += nb;
                        } else {
                            var id = args.load;
                        }
                        regSaves[id] = toSave;
                        localStorage["adm_limoncello_regsave"] = JSON.stringify(regSaves);
                        location.search = "?page=reg_new&load=" + id;

                    }
                });
            });

        } else if (args.page === "reg_home" && checkPerm("admin.reg")) {
            $("#reg_home .home_link").show();
            $(".return_arrow").show();
            $(".return_arrow a").attr("href", "?page=home");
            $("#reg_home").show();
            let saves = typeof localStorage["adm_limoncello_regsave"] === "undefined" ? {} : JSON.parse(localStorage["adm_limoncello_regsave"]);
            if (Object.keys(saves).length > 0) {
                for (let key in saves) {
                    $("#reg_home_list table").append("<tr><td>" + key + "</td><td><a href='?page=reg_new&load=" + key + "'>" + saves[key].type + " " + saves[key].title + "</a></td>\
                    <td class='delete' id='delete_" + key + "'>×</td><td class='export' id='export_" + key + "'>↓</td></tr>");
                }
                $(".delete").click(function () {
                    let id = this.id.replace(/delete_/, "");
                    visualPrompt("Voulez-vous vraiment supprimer le brouillon \"" + id + "\" ?", ["Oui", "Non"], function (ch) {
                        if (ch === "Oui") {
                            delete saves[id];
                            localStorage["adm_limoncello_regsave"] = JSON.stringify(saves);
                            location.reload();
                        }
                    });
                });
                $(".export").click(function () {
                    let id = this.id.replace(/export_/, ""),
                        saves = {};
                    saves[id] = JSON.parse(localStorage["adm_limoncello_regsave"])[id];
                    download(JSON.stringify(saves, null, 4), id + ".nosj", "text/plain");
                });
                $("#reg_home_list").show();
            }
            $("#reg_import_input").change(function () {
                let filename = this.files[0].name.split(".");
                console.log(filename)
                if (filename[filename.length - 1] !== "nosj") {
                    this.value = "";
                    return;
                }
                let reader = new FileReader();
                reader.addEventListener("load", function (f) {
                    let saves = JSON.parse(localStorage["adm_limoncello_regsave"]),
                        fimport = JSON.parse(reader.result),
                        mkey = Object.keys(fimport)[0],
                        nb = "";
                    fimport = fimport[mkey]
                    while (~Object.keys(saves).indexOf(mkey + nb)) {
                        if (nb === "") {
                            nb = 0;
                        } else {
                            nb += 1;
                        }
                    }
                    mkey = mkey + nb.toString();
                    saves[mkey] = fimport;
                    localStorage["adm_limoncello_regsave"] = JSON.stringify(saves);
                    location.search = "?page=reg_new&load=" + mkey;
                });
                reader.readAsText(this.files[0], "text/plain");
            });

        } else if (args.page === "newuser" && checkPerm("user.manage.new")) {
            $(".return_arrow").show();
            $(".return_arrow a").attr("href", "?page=usermanage");
            $("#usernew").show();
            $("#form_newuser").submit(function (e) {
                e.preventDefault();
                if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test($("#nwu_email").val().trim())) {
                    $("#p_error").html("");
                    $("#p_info").html("Veuillez patienter...<br/><img class='loading_img' src='https://media.giphy.com/media/sSgvbe1m3n93G/giphy.gif' alt=''/>");
                    $.ajax({
                        type: "POST",
                        url: IP + "user/new",
                        data: sessioned({
                            username: $("#nwu_pseudo").val().trim(),
                            title: $("#nwu_title").val().trim(),
                            email: $("#nwu_email").val().trim(),
                            dosendmail: $("#nwu_sendmail").prop("checked") ? 1 : 0,
                            perms: JSON.stringify($("#nwu_perms").val().trim().split(/\s*;\s*/g))
                        }),
                        dataType: "json",
                        success: function (response) {
                            if ($("#nwu_sendmail").prop("checked")) {
                                $("#p_info").html("Un nouvel utilisateur a été créé et les identifiants ont été envoyés par mail.")
                            } else {
                                $("#p_info").html("Un nouvel utilisateur a été créé avec les identifiants suivants :<br/>\
                                Nom d'utilisateur : " + response[0] + "<br>Mot de passe : " + response[1]);
                            }
                            $("#p_info").append("<br/><br/><a href='?page=usermanage'>Retourner à la liste des utilisateurs</a>");
                        }
                    });
                } else {
                    $("#p_error").html("L'adresse email n'est pas dans un format correct.")
                }

            });
        }
    } else {
        location.href = "index.html";
    }
});