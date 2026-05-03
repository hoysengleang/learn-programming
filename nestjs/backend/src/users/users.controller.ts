import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserInput } from './user.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() body: CreateUserInput) {
    return this.usersService.create(body);
  }
}
