package com.kinleoapple.oasis.controller;

import com.alibaba.fastjson.JSONObject;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.exceptions.InvalidAudioFrameException;
import org.jaudiotagger.audio.exceptions.ReadOnlyFileException;
import org.jaudiotagger.audio.mp3.MP3AudioHeader;
import org.jaudiotagger.audio.mp3.MP3File;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.TagException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;

@Controller
public class GetAudioInfo {

    @RequestMapping(value = "/GetAudioInfo", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response) throws IOException,
            CannotReadException, TagException,
            InvalidAudioFrameException, ReadOnlyFileException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            response.setContentType("text/plain");
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF-8");

            String mp3 = request.getParameter("mp3");

            String mp3Path = System.getProperty("user.dir") + File.separator + "library" + File.separator + mp3;
            File file = new File(mp3Path);
            MP3File f = (MP3File) AudioFileIO.read(file);
            MP3AudioHeader audioHeader = (MP3AudioHeader) f.getAudioHeader();
            JSONObject jsonObject = new JSONObject();
            if (f.hasID3v2Tag()) {
                Tag tag = f.getID3v2Tag();
                jsonObject.put("duration", audioHeader.getTrackLength());
                jsonObject.put("artist", tag.getFirst(FieldKey.ARTIST));
                jsonObject.put("title", tag.getFirst(FieldKey.TITLE));
            }
            response.getWriter().write(jsonObject.toJSONString());
        }
    }
}
