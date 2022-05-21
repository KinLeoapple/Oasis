package com.kinleoapple.oasis.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Controller
public class SetConfig {

    @RequestMapping(value = "/SetConfig", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.setContentType("text/plain");
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");

            String volume = request.getParameter("vol");
            String process = request.getParameter("process");
            String currentID = request.getParameter("currentID");
            String loopMode = request.getParameter("loopMode");
            String language = request.getParameter("language");
            String theme = request.getParameter("theme");

            String profilePath = System.getProperty("user.dir") + File.separator + "profile" + File.separator + "config";
            File profile = new File(profilePath);

            if (!profile.getParentFile().exists()) {
                profile.getParentFile().mkdirs();
            }
            if (!profile.exists()) {
                profile.createNewFile();
            }

            StringBuilder builder = new StringBuilder();
            builder.append("{\"volume\": \"").append(volume)
                    .append("\",\"process\":\"").append(process)
                    .append("\",\"currentID\":\"").append(currentID)
                    .append("\",\"loopMode\":\"").append(loopMode)
                    .append("\",\"lang\":\"").append(language)
                    .append("\",\"theme\":\"").append(theme).append("\"}");

            try (FileOutputStream outputStream = new FileOutputStream(profilePath)) {
                outputStream.write(builder.toString().getBytes(StandardCharsets.UTF_8));
            }

            response.getWriter().write("true");
        }
    }
}
