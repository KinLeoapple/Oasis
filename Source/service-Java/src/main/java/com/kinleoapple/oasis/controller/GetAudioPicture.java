package com.kinleoapple.oasis.controller;

import com.mpatric.mp3agic.ID3v2;
import com.mpatric.mp3agic.InvalidDataException;
import com.mpatric.mp3agic.Mp3File;
import com.mpatric.mp3agic.UnsupportedTagException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.util.Base64;

@Controller
public class GetAudioPicture {

    @RequestMapping(value = "/GetAudioPicture", method = {RequestMethod.GET, RequestMethod.POST})
    protected void execute(HttpServletRequest request, HttpServletResponse response, @RequestBody GetAudioPictureParameter parameter) throws IOException, InvalidDataException, UnsupportedTagException {
        if (request.getRemoteAddr().equals(request.getLocalAddr())) {
            String mp3 = parameter.getMp3();

            String mp3Path = System.getProperty("user.dir") + File.separator + "library" + File.separator + mp3;
            File file = new File(mp3Path);
            Mp3File mp3file = new Mp3File(file);
            ID3v2 id3v2Tag = mp3file.getId3v2Tag();
            byte[] albumImageData = id3v2Tag.getAlbumImage();
            if (albumImageData != null) {
                String base64 = Base64.getEncoder().encodeToString(albumImageData);
                base64 = "data:" + id3v2Tag.getAlbumImageMimeType() + ";base64," + base64;
                response.getWriter().write(base64);
            } else {
                response.getWriter().write("null");
            }
        }
    }
}

class GetAudioPictureParameter {

    private String mp3;

    public String getMp3() {
        return mp3;
    }

    public void setMp3(String mp3) {
        this.mp3 = mp3;
    }
}
