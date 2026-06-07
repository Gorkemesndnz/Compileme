package com.compileme.common.exception;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.time.OffsetDateTime;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping(value = "/error", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<ApiError> handleErrorJson(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object message = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        Object path = request.getAttribute(RequestDispatcher.FORWARD_REQUEST_URI);

        int statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value();
        String statusText = HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase();

        if (status != null) {
            try {
                int code = Integer.parseInt(status.toString());
                statusCode = code;
                statusText = HttpStatus.valueOf(code).getReasonPhrase();
            } catch (Exception e) {
                // Ignore parse or valueOf errors
            }
        }

        String msg = message != null ? message.toString() : "Beklenmeyen hata";
        if (msg.isBlank()) {
            if (statusCode == 404) {
                msg = "İstenen kaynak bulunamadı.";
            } else if (statusCode == 503) {
                msg = "Servis geçici olarak servis dışı.";
            } else {
                msg = "Sistemsel bir hata oluştu.";
            }
        }
        
        String requestPath = path != null ? path.toString() : request.getRequestURI();

        ApiError error = new ApiError(
                OffsetDateTime.now(),
                statusCode,
                statusText,
                msg,
                requestPath
        );

        return new ResponseEntity<>(error, HttpStatus.valueOf(statusCode));
    }

    @RequestMapping(value = "/error", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> handleErrorHtml(HttpServletRequest request) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object message = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        
        int statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value();
        String statusText = HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase();

        if (status != null) {
            try {
                int code = Integer.parseInt(status.toString());
                statusCode = code;
                statusText = HttpStatus.valueOf(code).getReasonPhrase();
            } catch (Exception e) {
                // Ignore parse or valueOf errors
            }
        }

        String msg = message != null ? message.toString() : "";
        if (msg.isBlank()) {
            if (statusCode == 404) {
                msg = "Aradığınız sayfa veya kaynak bulunamadı. Lütfen URL'yi kontrol ediniz.";
            } else if (statusCode == 503) {
                msg = "Veritabanı veya hava durumu gibi dış servisler geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
            } else {
                msg = "İşleminiz gerçekleştirilirken sistemsel bir hata meydana geldi.";
            }
        }

        String html = getErrorHtmlPage(statusCode, statusText, msg);
        return new ResponseEntity<>(html, HttpStatus.valueOf(statusCode));
    }

    private String getErrorHtmlPage(int code, String status, String message) {
        String title = "Hata " + code;
        String icon = "⚠️";
        if (code == 404) {
            icon = "🔍";
            title = "404 - Bulunamadı";
        } else if (code == 503) {
            icon = "⏳";
            title = "503 - Servis Devre Dışı";
        } else if (code >= 500) {
            icon = "🔥";
            title = "500 - Sunucu Hatası";
        }

        return "<!DOCTYPE html>\n" +
                "<html lang=\"tr\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>" + title + " - Compileme</title>\n" +
                "    <style>\n" +
                "        body {\n" +
                "            background-color: #0b0f19;\n" +
                "            color: #f3f4f6;\n" +
                "            font-family: system-ui, -apple-system, sans-serif;\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            min-height: 100vh;\n" +
                "            margin: 0;\n" +
                "        }\n" +
                "        .error-card {\n" +
                "            background: rgba(15, 23, 42, 0.6);\n" +
                "            backdrop-filter: blur(12px);\n" +
                "            border: 1px solid rgba(0, 230, 230, 0.2);\n" +
                "            border-radius: 16px;\n" +
                "            padding: 40px;\n" +
                "            max-width: 500px;\n" +
                "            width: 90%;\n" +
                "            text-align: center;\n" +
                "            box-shadow: 0 0 30px rgba(0, 230, 230, 0.05), inset 0 0 1px rgba(255,255,255,0.05);\n" +
                "        }\n" +
                "        .icon {\n" +
                "            font-size: 64px;\n" +
                "            margin-bottom: 20px;\n" +
                "        }\n" +
                "        h1 {\n" +
                "            font-size: 56px;\n" +
                "            margin: 0 0 10px 0;\n" +
                "            font-weight: 800;\n" +
                "            background: linear-gradient(135deg, #00e6e6, #00b3b3);\n" +
                "            -webkit-background-clip: text;\n" +
                "            -webkit-text-fill-color: transparent;\n" +
                "        }\n" +
                "        .status-text {\n" +
                "            font-size: 14px;\n" +
                "            text-transform: uppercase;\n" +
                "            letter-spacing: 1.5px;\n" +
                "            color: #64748b;\n" +
                "            margin-bottom: 20px;\n" +
                "            font-weight: 600;\n" +
                "        }\n" +
                "        p {\n" +
                "            color: #94a3b8;\n" +
                "            font-size: 16px;\n" +
                "            line-height: 1.6;\n" +
                "            margin: 0 0 30px 0;\n" +
                "        }\n" +
                "        .btn {\n" +
                "            display: inline-flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: center;\n" +
                "            background: rgba(0, 230, 230, 0.1);\n" +
                "            color: #00e6e6;\n" +
                "            border: 1px solid rgba(0, 230, 230, 0.2);\n" +
                "            padding: 10px 24px;\n" +
                "            border-radius: 8px;\n" +
                "            font-weight: 600;\n" +
                "            text-decoration: none;\n" +
                "            transition: all 0.2s;\n" +
                "            cursor: pointer;\n" +
                "        }\n" +
                "        .btn:hover {\n" +
                "            background: #00e6e6;\n" +
                "            color: #0b0f19;\n" +
                "            box-shadow: 0 0 15px rgba(0, 230, 230, 0.4);\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"error-card\">\n" +
                "        <div class=\"icon\">" + icon + "</div>\n" +
                "        <h1>" + code + "</h1>\n" +
                "        <div class=\"status-text\">" + status + "</div>\n" +
                "        <p>" + message + "</p>\n" +
                "        <a href=\"/\" class=\"btn\">Anasayfaya Dön</a>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
