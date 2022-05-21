package com.kinleoapple.oasis.controller;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

@Controller
public class GetAudioID {

    @RequestMapping(value = "/GetAudioID", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.setContentType("text/plain");
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");

            String mp3 = request.getParameter("mp3");

            String musicPath = System.getProperty("user.dir") + File.separator + "profile" + File.separator + "music";
            JSONObject jsonObject = JSON.parseObject(new String(Files.readAllBytes(Paths.get(musicPath)), StandardCharsets.UTF_8));
            String id = jsonObject.get(mp3).toString();

            response.getWriter().write(id);
        }
    }
}
