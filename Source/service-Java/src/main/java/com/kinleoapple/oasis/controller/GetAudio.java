package com.kinleoapple.oasis.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;

@Controller
public class GetAudio {

    @RequestMapping(value = "/GetAudio", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            try {
                response.setContentType("text/plain");
                request.setCharacterEncoding("UTF-8");
                response.setCharacterEncoding("UTF-8");

                String mp3 = request.getParameter("mp3");

                if (mp3 != null && !mp3.equals("null")) {
                    String mp3Path = System.getProperty("user.dir") + File.separator + "library" + File.separator + mp3;
                    File file = new File(mp3Path);

//                    byte[] bytes = Files.readAllBytes(Paths.get(file.getAbsolutePath()));
//                    String base64 = "data:audio/mp3;base64," + Base64.getEncoder().encodeToString(bytes);
                    response.getWriter().write(file.getAbsolutePath());
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
