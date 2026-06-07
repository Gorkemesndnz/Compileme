package com.compileme.weather;

import com.compileme.common.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Service
public class WeatherService {

    private final String apiKey;
    private final RestClient restClient;

    @Autowired
    public WeatherService(@Value("${app.weather.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.openweathermap.org/data/2.5")
                .build();
    }

    // Test constructor
    WeatherService(String apiKey, RestClient restClient) {
        this.apiKey = apiKey;
        this.restClient = restClient;
    }

    public String getWeatherData(String city, Double lat, Double lon) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Hava durumu API anahtarı (OPENWEATHER_API_KEY) yapılandırılmamış.");
        }

        boolean hasCoords = (lat != null && lon != null);
        boolean hasCity = (city != null && !city.isBlank());

        if (!hasCoords && !hasCity) {
            throw new IllegalArgumentException("Hava durumu sorgulamak için şehir adı veya koordinat (enlem/boylam) bilgisi verilmelidir.");
        }

        try {
            return restClient.get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/weather");
                        if (hasCoords) {
                            uriBuilder.queryParam("lat", lat)
                                      .queryParam("lon", lon);
                        } else {
                            uriBuilder.queryParam("q", city);
                        }
                        uriBuilder.queryParam("appid", apiKey)
                                  .queryParam("units", "metric")
                                  .queryParam("lang", "tr");
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .body(String.class);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new NotFoundException("Belirtilen lokasyon için hava durumu bilgisi bulunamadı.");
            }
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                throw new IllegalStateException("Hava durumu API anahtarı geçersiz veya yetkisiz.");
            }
            throw e;
        }
    }
}
