package com.kinleoapple.oasis.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Stream;

@Controller
public class GetAudioLyric {

    @RequestMapping(value = "/GetAudioLyric", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response, @RequestBody GetAudioLyricParameter parameter) throws IOException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.setContentType("text/plain");
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");

            String mp3 = parameter.getMp3();

            StringBuilder lyrics = new StringBuilder();
            String lrcPath = System.getProperty("user.dir") + File.separator + "library" + File.separator + mp3.substring(0, mp3.lastIndexOf('.')) + ".lrc";
            File lrcFile = new File(lrcPath);
            if (lrcFile.exists()) {
                Stream<String> lines = Files.lines(Paths.get(lrcFile.getAbsolutePath()));
                lines.parallel().forEachOrdered(ele -> {
                    lyrics.append(ele).append("\n");
                });
            }
            response.getWriter().write(lyrics.toString());
        }
    }
}

class GetAudioLyricParameter {

    private String mp3;

    public String getMp3() {
        return mp3;
    }

    public void setMp3(String mp3) {
        this.mp3 = mp3;
    }
}
