package com.example.demo;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Service
public class RaffleService {
    private final SecureRandom random = new SecureRandom();

    public String selectWinner(List<String> names) {
        if (names == null || names.isEmpty()) {
            throw new IllegalArgumentException("Provide at least one name.");
        }

        if (names.stream().anyMatch(name -> name == null || name.isBlank())) {
            throw new IllegalArgumentException("Names cannot be blank.");
        }

        int winnerIndex = random.nextInt(names.size());
        return names.get(winnerIndex).trim();
    }
}