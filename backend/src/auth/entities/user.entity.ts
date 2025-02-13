// src/auth/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { IsEmail, MinLength } from 'class-validator';

/**
 * Entidad User que representa la tabla "user" en la BD.
 */
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @MinLength(6)
  password: string;
}
