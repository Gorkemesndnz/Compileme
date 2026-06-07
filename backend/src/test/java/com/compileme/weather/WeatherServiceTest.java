package com.compileme.weather;

import com.compileme.common.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.hamcrest.Matchers.containsString;

class WeatherServiceTest {

    private WeatherService weatherService;
    private MockRestServiceServer mockServer;
    private String apiKey = "test-api-key";

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.baseUrl("https://api.openweathermap.org/data/2.5").build();
        weatherService = new WeatherService(apiKey, restClient);
    }

    @Test
    void getWeatherData_ShouldReturnRawJson_WhenCityProvided() {
        String mockResponse = "{\"name\":\"Izmir\",\"main\":{\"temp\":25.0}}";

        mockServer.expect(requestTo(containsString("/weather")))
                .andRespond(withSuccess(mockResponse, MediaType.APPLICATION_JSON));

        String result = weatherService.getWeatherData("Izmir", null, null);

        assertNotNull(result);
        assertTrue(result.contains("Izmir"));
        mockServer.verify();
    }

    @Test
    void getWeatherData_ShouldReturnRawJson_WhenCoordsProvided() {
        String mockResponse = "{\"name\":\"Izmir\",\"main\":{\"temp\":25.0}}";

        mockServer.expect(requestTo(containsString("lat=38.4")))
                .andRespond(withSuccess(mockResponse, MediaType.APPLICATION_JSON));

        String result = weatherService.getWeatherData(null, 38.4, 27.1);

        assertNotNull(result);
        mockServer.verify();
    }

    @Test
    void getWeatherData_ShouldThrowIllegalStateException_WhenApiKeyEmpty() {
        WeatherService unconfiguredService = new WeatherService("", RestClient.create());
        assertThrows(IllegalStateException.class, () -> unconfiguredService.getWeatherData("Izmir", null, null));
    }

    @Test
    void getWeatherData_ShouldThrowIllegalArgumentException_WhenNoParams() {
        assertThrows(IllegalArgumentException.class, () -> weatherService.getWeatherData("", null, null));
    }

    @Test
    void getWeatherData_ShouldThrowNotFound_WhenOpenWeatherReturns404() {
        mockServer.expect(requestTo(containsString("/weather")))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThrows(NotFoundException.class, () -> weatherService.getWeatherData("UnknownCity", null, null));
    }
}
