import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { Gender } from '../enums/gender.enum';
import { VisaStatus } from '../enums/visa-status.enum';

@Entity('visa_applications')
export class VisaApplication extends BaseEntity
{
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'int', unique: true })
	visa_number: number;

	@Column({ type: 'enum', enum: VisaStatus })
	visa_status: VisaStatus;

	@Column({ type: 'varchar', length: 128, nullable: true })
	first_name: string;

	@Column({ type: 'varchar', length: 64, nullable: true })
	last_name: string;

	@Column({ type: 'enum', enum: Gender })
	gender: Gender;

	@Column({ type: 'varchar', length: 64, nullable: true })
	nationality: string;

	@Column({ type: 'varchar', length: 32 })
	passport_number: string;

	@Column({ type: 'date', nullable: true })
	passport_expires_at: Date;

	@Column({ type: 'date', nullable: true })
	visa_last_changed_at: Date;

	@Column({ type: 'boolean', default: false })
	active: boolean;
}
