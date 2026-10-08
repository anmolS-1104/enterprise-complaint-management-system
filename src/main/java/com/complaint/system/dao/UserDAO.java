package com.complaint.system.dao;

import com.complaint.system.model.User;

public interface UserDAO {
    User findByEmail(String email);
    boolean save(User user);
}