INSERT INTO public._prisma_migrations (
		id,
		checksum,
		finished_at,
		migration_name,
		logs,
		rolled_back_at,
		started_at,
		applied_steps_count
	)
VALUES (
		'7be42e03-50bf-49ba-943e-7abdb9ab771a',
		'da24af95e6f784698139952afd5a34e4787841785f112fc80d18e3c759252667',
		'2026-04-26 19:20:01.375015+00',
		'20260425024543_remove_audit_logs',
		NULL,
		NULL,
		'2026-04-26 19:20:00.804539+00',
		1
	),
	(
		'ec64e47f-e36a-4fbd-adf6-0467cca69fc4',
		'c7a4e321c6bd38168492ac01b113db22e22a3bc4bf2c931be9026cb69de3b1b2',
		'2026-04-26 19:20:02.021583+00',
		'20260426150348_add_role_id_to_group_routines',
		NULL,
		NULL,
		'2026-04-26 19:20:01.559735+00',
		1
	),
	(
		'237b1d7e-5dab-4bf1-b32a-ec1a17b049e9',
		'2636a27f191091bc1b944eb9c16f11717c088712c951e77f37dacaa6254e5d6c',
		'2026-04-26 19:20:03.100266+00',
		'20260426173519_add_maintenance_logs',
		NULL,
		NULL,
		'2026-04-26 19:20:02.201779+00',
		1
	),
	(
		'31b29d8f-8789-41b1-ae8f-608599fdc917',
		'ec1fc38a871832d4c39f9e17ab1f9514448f132b72965601fad64fba4fd64a6a',
		'2026-04-26 19:20:11.119223+00',
		'20260426192009_init_supabase',
		NULL,
		NULL,
		'2026-04-26 19:20:10.336559+00',
		1
	);
INSERT INTO public.event_rsvps (id, event_id, user_id, status, created_at)
VALUES (
		'fcf2ecfc-0bd3-440a-8cd4-11ed18b0b3b7'::uuid,
		'ff7ef790-83f0-448b-bb45-6ab23f5555a5'::uuid,
		'35048614-dd23-4373-bd39-6a062a6ecbc6'::uuid,
		'confirmed',
		'2026-04-27 03:53:52.803+00'
	),
	(
		'31ee3ae1-df34-4515-8583-2d9e0fc54751'::uuid,
		'ff7ef790-83f0-448b-bb45-6ab23f5555a5'::uuid,
		'48cba748-94ce-4e34-aac1-7d02a9d81ff4'::uuid,
		'confirmed',
		'2026-04-27 15:37:23.675+00'
	);
INSERT INTO public.events (
		id,
		title,
		description,
		event_date,
		"location",
		is_general,
		group_id,
		created_by,
		created_at,
		updated_at,
		event_type,
		banner_url,
		speakers,
		price,
		pix_key,
		pix_qrcode_url,
		map_url,
		send_whatsapp,
		require_checkin,
		checkin_qr_secret,
		is_public
	)
VALUES (
		'ff7ef790-83f0-448b-bb45-6ab23f5555a5'::uuid,
		'Culto de Celebração 2 - 29/04',
		'',
		'2026-04-29 22:30:00+00',
		'Igreja CC Mergulho',
		true,
		NULL,
		'c52bc81a-0473-4731-b01a-ece82d298c43'::uuid,
		'2026-04-26 23:48:39.407+00',
		'2026-04-26 23:48:39.407+00',
		'simple',
		'/api/uploads/f1dda1b8-bd74-4397-86e5-36b0deb6ce01.jpeg',
		NULL,
		0,
		NULL,
		NULL,
		NULL,
		false,
		false,
		NULL,
		true
	);
INSERT INTO public.group_routines (
		id,
		routine_key,
		is_enabled,
		updated_at,
		group_id,
		role_id
	)
VALUES (
		'22a64319-435e-48ef-b65c-76c16a172e8d'::uuid,
		'voluntarios',
		true,
		'2026-04-26 19:55:32.385+00',
		NULL,
		'071c2037-fa67-43ab-9d1b-4480fe15fd92'::uuid
	),
	(
		'1b391d61-ca8a-46bd-b8f5-c2e56fb114d8'::uuid,
		'voluntarios',
		false,
		'2026-04-26 19:55:32.815+00',
		NULL,
		'071c2037-fa67-43ab-9d1b-4480fe15fd92'::uuid
	),
	(
		'c8c60354-22e1-43d2-a088-2c51bc1e4eda'::uuid,
		'devocionais',
		true,
		'2026-04-27 01:49:37.415+00',
		NULL,
		'071c2037-fa67-43ab-9d1b-4480fe15fd92'::uuid
	),
	(
		'f0e27f96-5e56-459e-ab9d-16ad0eefb0e2'::uuid,
		'devocionais',
		true,
		'2026-04-27 01:49:37.559+00',
		NULL,
		'071c2037-fa67-43ab-9d1b-4480fe15fd92'::uuid
	),
	(
		'b5e70d9c-24f3-41aa-96a3-4f17fafcdc94'::uuid,
		'agenda',
		true,
		'2026-04-27 01:49:40.026+00',
		NULL,
		'071c2037-fa67-43ab-9d1b-4480fe15fd92'::uuid
	),
	(
		'04a6c36f-95ef-4b24-9523-3f26ceef718a'::uuid,
		'agenda',
		true,
		'2026-04-27 01:49:40.37+00',
		NULL,
		'071c2037-fa67-43ab-9d1b-4480fe15fd92'::uuid
	),
	(
		'a3bf08d1-ee93-4d08-9ca7-7ca864216f67'::uuid,
		'chat',
		true,
		'2026-04-27 01:49:43.286+00',
		NULL,
		'071c2037-fa67-43ab-9d1b-4480fe15fd92'::uuid
	),
	(
		'66482c0c-cc94-44cd-836e-35ba9e3080ad'::uuid,
		'chat',
		true,
		'2026-04-27 01:49:43.335+00',
		NULL,
		'071c2037-fa67-43ab-9d1b-4480fe15fd92'::uuid
	),
	(
		'aba5d895-a0b4-4b68-9d59-6ab9d2bf72de'::uuid,
		'agenda',
		true,
		'2026-04-27 01:49:54.811+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'af7dd7c6-cac6-474f-b0a3-b43750768aab'::uuid,
		'agenda',
		true,
		'2026-04-27 01:49:54.819+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	);
INSERT INTO public.group_routines (
		id,
		routine_key,
		is_enabled,
		updated_at,
		group_id,
		role_id
	)
VALUES (
		'e593c2a2-0672-4176-80fc-6e6e8827295d'::uuid,
		'devocionais',
		true,
		'2026-04-27 01:49:55.692+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'a06bab76-d3fc-4c07-9408-068ebdcabd1d'::uuid,
		'voluntarios',
		true,
		'2026-04-27 01:49:56.895+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'0be3cb1e-8a17-487f-ae53-3d30df68930a'::uuid,
		'voluntarios',
		true,
		'2026-04-27 01:49:56.932+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'fe233f9e-3195-4d38-ac1f-7bcaf648abde'::uuid,
		'membros',
		true,
		'2026-04-27 01:49:58.942+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'c4bc7752-3e66-47d3-a4dc-3d7bc837a6a8'::uuid,
		'membros',
		true,
		'2026-04-27 01:49:58.988+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'cad48b1b-5e83-4b63-8d34-6511d3615ae4'::uuid,
		'chat',
		true,
		'2026-04-27 01:50:00.989+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'a851e76f-a7f5-4bfb-bbb4-7ed13ea97382'::uuid,
		'chat',
		true,
		'2026-04-27 01:50:01.077+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'd13a9d3b-81e6-4251-a24c-e7af8be7ed97'::uuid,
		'checkin',
		true,
		'2026-04-27 01:50:02.866+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'4cf3b44f-4b28-4351-983a-4a067dd929b0'::uuid,
		'checkin',
		true,
		'2026-04-27 01:50:02.875+00',
		NULL,
		'3e4bce2a-7856-4801-b466-7b8e3d12a74b'::uuid
	),
	(
		'323cc51f-9ecb-4ac7-a325-76c8fc54f950'::uuid,
		'agenda',
		true,
		'2026-04-27 03:48:59.994+00',
		'801abcb4-4612-4ac4-8030-942664f0d718'::uuid,
		NULL
	);
INSERT INTO public.group_routines (
		id,
		routine_key,
		is_enabled,
		updated_at,
		group_id,
		role_id
	)
VALUES (
		'bbe36e5d-b861-4c26-a440-8a908752cc31'::uuid,
		'devocionais',
		true,
		'2026-04-27 03:49:04.413+00',
		'801abcb4-4612-4ac4-8030-942664f0d718'::uuid,
		NULL
	),
	(
		'09a36fb3-28b8-4ca3-9358-b6e5d4ef9c83'::uuid,
		'chat',
		true,
		'2026-04-27 03:49:08.287+00',
		'801abcb4-4612-4ac4-8030-942664f0d718'::uuid,
		NULL
	),
	(
		'e3857a86-78a1-4b67-8152-e149a2a73a3e'::uuid,
		'agenda',
		true,
		'2026-04-27 03:49:22.391+00',
		'd8af8fe4-fe84-487b-8b64-36ffbbefbae4'::uuid,
		NULL
	),
	(
		'c4bb25d7-8730-427c-8547-ac87d574a3ae'::uuid,
		'chat',
		true,
		'2026-04-27 03:49:25.74+00',
		'd8af8fe4-fe84-487b-8b64-36ffbbefbae4'::uuid,
		NULL
	),
	(
		'eed61d4b-9dc7-4509-b839-2b4f1e24fb08'::uuid,
		'agenda',
		true,
		'2026-04-27 03:49:39.895+00',
		'afe2a1bc-4353-490f-b2a2-d5d57cf525cb'::uuid,
		NULL
	),
	(
		'969af08f-350b-4ae9-a4aa-5e3d7a96a339'::uuid,
		'voluntarios',
		true,
		'2026-04-27 03:49:42.065+00',
		'afe2a1bc-4353-490f-b2a2-d5d57cf525cb'::uuid,
		NULL
	),
	(
		'ad49d51a-2995-4187-9fc4-42300b83928d'::uuid,
		'chat',
		true,
		'2026-04-27 03:49:46.129+00',
		'afe2a1bc-4353-490f-b2a2-d5d57cf525cb'::uuid,
		NULL
	),
	(
		'c083a4d3-5a56-4947-a6cf-fdfba4acc011'::uuid,
		'agenda',
		true,
		'2026-04-27 03:50:04.528+00',
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		NULL
	),
	(
		'f39ff70f-5509-429b-bab2-790dfc028416'::uuid,
		'devocionais',
		true,
		'2026-04-27 03:50:06.59+00',
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		NULL
	),
	(
		'b5629d09-7d70-4da5-bffe-f8c8d6b08bc5'::uuid,
		'voluntarios',
		true,
		'2026-04-27 03:50:08.516+00',
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		NULL
	);
INSERT INTO public.group_routines (
		id,
		routine_key,
		is_enabled,
		updated_at,
		group_id,
		role_id
	)
VALUES (
		'c6a58a1a-fc62-4dba-abb4-3a889175cb1e'::uuid,
		'chat',
		true,
		'2026-04-27 03:50:12.747+00',
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		NULL
	),
	(
		'bffe511d-f128-4671-ba40-729ea2926a5e'::uuid,
		'agenda',
		true,
		'2026-04-27 03:50:23.826+00',
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		NULL
	),
	(
		'd5257827-afea-48bf-ac56-e1331a43c3e1'::uuid,
		'voluntarios',
		true,
		'2026-04-27 03:50:25.632+00',
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		NULL
	),
	(
		'deaa2ff2-ebd3-4674-b412-089d20986ebb'::uuid,
		'chat',
		true,
		'2026-04-27 03:50:27.981+00',
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		NULL
	),
	(
		'bbea913b-42ce-4b10-8681-8449a9257b27'::uuid,
		'agenda',
		true,
		'2026-04-27 03:50:34.966+00',
		'd01a0ee9-8bc7-4984-b3d5-7ab1f95992f3'::uuid,
		NULL
	),
	(
		'f99a1c25-a348-4531-84be-504ee56df4a2'::uuid,
		'voluntarios',
		true,
		'2026-04-27 03:50:37.169+00',
		'd01a0ee9-8bc7-4984-b3d5-7ab1f95992f3'::uuid,
		NULL
	),
	(
		'5f710daa-0153-4e4b-85ce-ce3e694edc2f'::uuid,
		'chat',
		true,
		'2026-04-27 03:50:40.572+00',
		'd01a0ee9-8bc7-4984-b3d5-7ab1f95992f3'::uuid,
		NULL
	),
	(
		'e6c147f3-2dce-456b-89e6-038c60e5f277'::uuid,
		'agenda',
		true,
		'2026-04-27 03:50:47.968+00',
		'f2a6de49-0168-4bd2-8372-3af4e696cfea'::uuid,
		NULL
	),
	(
		'bf5eaba9-a3ce-4c50-9afb-8460559f7f89'::uuid,
		'devocionais',
		true,
		'2026-04-27 03:50:49.789+00',
		'f2a6de49-0168-4bd2-8372-3af4e696cfea'::uuid,
		NULL
	),
	(
		'93b22035-53cb-4031-a598-33fc48a11ad3'::uuid,
		'voluntarios',
		true,
		'2026-04-27 03:50:58.982+00',
		'f2a6de49-0168-4bd2-8372-3af4e696cfea'::uuid,
		NULL
	);
INSERT INTO public.group_routines (
		id,
		routine_key,
		is_enabled,
		updated_at,
		group_id,
		role_id
	)
VALUES (
		'116f492d-d152-42ab-beec-6b777c6e4f2b'::uuid,
		'chat',
		true,
		'2026-04-27 03:51:04.014+00',
		'f2a6de49-0168-4bd2-8372-3af4e696cfea'::uuid,
		NULL
	),
	(
		'86429e09-85e1-4e4d-ae1d-12309731834a'::uuid,
		'checkin',
		true,
		'2026-04-27 03:51:06.913+00',
		'f2a6de49-0168-4bd2-8372-3af4e696cfea'::uuid,
		NULL
	),
	(
		'3d9f2021-2cac-47b6-aace-fcdf12d4d210'::uuid,
		'agenda',
		true,
		'2026-04-27 03:51:14.637+00',
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		NULL
	),
	(
		'164ac6ee-c8f9-4628-8c4d-894ebc289f42'::uuid,
		'devocionais',
		true,
		'2026-04-27 03:51:16.585+00',
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		NULL
	),
	(
		'9064efb0-bab9-4fce-8f1f-65f64616176d'::uuid,
		'voluntarios',
		true,
		'2026-04-27 03:51:21.563+00',
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		NULL
	),
	(
		'17a7db3c-0d65-4fcc-bb16-135a34436d46'::uuid,
		'membros',
		true,
		'2026-04-27 03:51:23.86+00',
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		NULL
	),
	(
		'828a9962-81f6-4736-b9e2-6417d4f3690f'::uuid,
		'chat',
		true,
		'2026-04-27 03:51:26.443+00',
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		NULL
	),
	(
		'aa5c7da9-98f7-4ade-987b-67289a23cbb9'::uuid,
		'checkin',
		true,
		'2026-04-27 03:51:31.67+00',
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		NULL
	),
	(
		'4905c39f-ef3e-4c1e-96b9-fc9871202a45'::uuid,
		'disparos',
		true,
		'2026-04-27 03:51:34.139+00',
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		NULL
	),
	(
		'fa18d228-5ca5-413a-9ea2-e9e88e66ab30'::uuid,
		'agenda',
		true,
		'2026-04-27 03:51:44.664+00',
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		NULL
	);
INSERT INTO public.group_routines (
		id,
		routine_key,
		is_enabled,
		updated_at,
		group_id,
		role_id
	)
VALUES (
		'46898250-56d7-4cca-9c34-4abcd1a9f93c'::uuid,
		'devocionais',
		true,
		'2026-04-27 03:51:47.163+00',
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		NULL
	),
	(
		'd0e819c9-99d1-4046-8df0-8fe6ad78d71e'::uuid,
		'voluntarios',
		true,
		'2026-04-27 03:51:49.447+00',
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		NULL
	),
	(
		'da480165-b53d-47ef-ac40-8da266f7545f'::uuid,
		'chat',
		true,
		'2026-04-27 03:51:53.518+00',
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		NULL
	),
	(
		'970ba00c-f141-4140-ac7e-3fa99d822755'::uuid,
		'agenda',
		true,
		'2026-04-27 03:52:03.02+00',
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		NULL
	),
	(
		'0b98016e-6aec-4b6f-97df-bc43916657fb'::uuid,
		'devocionais',
		true,
		'2026-04-27 03:52:06.236+00',
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		NULL
	),
	(
		'3cf7d5c6-edb9-40e8-b66a-31bd715f18e6'::uuid,
		'voluntarios',
		true,
		'2026-04-27 03:52:11.739+00',
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		NULL
	),
	(
		'1dd8d895-f5de-4768-91b4-6faf9290a58b'::uuid,
		'chat',
		true,
		'2026-04-27 03:52:23.455+00',
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		NULL
	),
	(
		'2d3e238b-478a-4639-b0cc-6b081db50156'::uuid,
		'checkin',
		false,
		'2026-04-27 03:52:25.875+00',
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		NULL
	),
	(
		'04361b72-b16d-4f4e-a272-41d49e75a882'::uuid,
		'disparos',
		false,
		'2026-04-27 03:52:28.308+00',
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		NULL
	),
	(
		'74adea8a-68c3-4b0c-984f-d23554c9f865'::uuid,
		'relatorios',
		false,
		'2026-04-27 03:52:19.355+00',
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		NULL
	);
INSERT INTO public.group_routines (
		id,
		routine_key,
		is_enabled,
		updated_at,
		group_id,
		role_id
	)
VALUES (
		'df6501d3-2937-4c7a-a12b-574fda1eb823'::uuid,
		'membros',
		false,
		'2026-04-27 03:52:14.489+00',
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		NULL
	),
	(
		'8df73c91-fc54-46b5-84e4-28f70276d094'::uuid,
		'agenda',
		true,
		'2026-04-27 03:52:53.054+00',
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		NULL
	),
	(
		'0b19846c-6daf-4c11-b181-2e37486814ba'::uuid,
		'devocionais',
		true,
		'2026-04-27 03:52:55.547+00',
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		NULL
	),
	(
		'0d81cd15-b7f7-4276-9a18-9444f891479f'::uuid,
		'chat',
		true,
		'2026-04-27 03:53:00.942+00',
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		NULL
	);
INSERT INTO public."groups" (
		id,
		name,
		description,
		icon,
		created_at,
		updated_at
	)
VALUES (
		'801abcb4-4612-4ac4-8030-942664f0d718'::uuid,
		'Acolhimento',
		'',
		'🌊',
		'2026-04-27 01:41:46.701+00',
		'2026-04-27 01:41:46.701+00'
	),
	(
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'Mulheres',
		'',
		'🌊',
		'2026-04-27 01:42:01.646+00',
		'2026-04-27 01:42:01.646+00'
	),
	(
		'f2a6de49-0168-4bd2-8372-3af4e696cfea'::uuid,
		'checkin',
		'',
		'🌊',
		'2026-04-27 01:42:08.139+00',
		'2026-04-27 01:42:08.139+00'
	),
	(
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'Mídia',
		'',
		'🌊',
		'2026-04-27 01:42:13.77+00',
		'2026-04-27 01:42:13.77+00'
	),
	(
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'Homens',
		'',
		'🌊',
		'2026-04-27 01:42:20.641+00',
		'2026-04-27 01:42:20.641+00'
	),
	(
		'd8af8fe4-fe84-487b-8b64-36ffbbefbae4'::uuid,
		'Dança',
		'',
		'🌊',
		'2026-04-27 01:42:40.813+00',
		'2026-04-27 01:42:40.813+00'
	),
	(
		'd01a0ee9-8bc7-4984-b3d5-7ab1f95992f3'::uuid,
		'Iluminação',
		'',
		'🌊',
		'2026-04-27 01:42:49.184+00',
		'2026-04-27 01:42:49.184+00'
	),
	(
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'Louvor',
		'',
		'🌊',
		'2026-04-27 01:42:56.472+00',
		'2026-04-27 01:42:56.472+00'
	),
	(
		'afe2a1bc-4353-490f-b2a2-d5d57cf525cb'::uuid,
		'Diving Girls',
		'',
		'🌊',
		'2026-04-27 01:43:11.81+00',
		'2026-04-27 01:43:11.81+00'
	),
	(
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'Diving Hope',
		'',
		'🌊',
		'2026-04-27 01:41:54.759+00',
		'2026-04-27 01:43:21.777+00'
	);
INSERT INTO public."groups" (
		id,
		name,
		description,
		icon,
		created_at,
		updated_at
	)
VALUES (
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'Lideranças',
		'',
		'🌊',
		'2026-04-27 01:43:35.466+00',
		'2026-04-27 01:43:35.466+00'
	);
INSERT INTO public.maintenance_logs (
		id,
		script_id,
		executor_id,
		details,
		status,
		created_at
	)
VALUES (
		'5fbb5668-b5fb-4101-96af-be979acd6c86'::uuid,
		'create-user',
		'c52bc81a-0473-4731-b01a-ece82d298c43'::uuid,
		'Usuário criado: jarde@ccmergulho.com com role admin',
		'success',
		'2026-04-26 19:58:11.548+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'425fb400-b3d5-4b61-a8f5-d724abdfc7c2'::uuid,
		'54b3528d-d8b3-42c6-99f5-a2e76f524329'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'd205e723-34ee-4b62-8272-381840b2ddaa'::uuid,
		'559e5c2e-f672-4f79-a6f5-8cacadb8b8aa'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'9bc95aa9-db6a-4553-b1c2-93e498e7dbe2'::uuid,
		'428932b5-3e26-47be-b84f-d89208e19e90'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'9e0dc3b1-3efb-4abf-ad0d-c2d325c521d1'::uuid,
		'a4832b00-31c8-4ec3-a9ed-8e22a517d1a3'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'a988bc05-c32b-40f3-8441-5b64232cd52b'::uuid,
		'40d44ab6-a865-4230-8774-2660819eb1af'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'dbea4bc3-1264-478d-b145-947be43fc992'::uuid,
		'0dd201a5-3d3f-4130-90c1-0d76ec410fbf'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'4a6fc75f-b2b6-4111-b26e-d91824022207'::uuid,
		'573f4864-ccb2-4b39-ad8c-bc7bf1162bd8'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'155f1514-abbe-4c21-b6f7-66f6b195a3dc'::uuid,
		'b1768fd3-e36b-40f9-8881-5516e4f1c195'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'406be2bb-30d8-422d-ad29-3724435f0b8a'::uuid,
		'19632ca8-8f4a-421e-9d7d-721c4a39348f'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'90419051-39f3-4e32-a372-3e8aba03b70a'::uuid,
		'a82c88ba-ff52-4421-b758-07c942e0c8fe'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'2c6b688e-9c23-4ad7-b909-23931d3507b6'::uuid,
		'847630b7-bf6c-4822-b3eb-0c69d525f8ec'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'8e97ea72-9771-4a37-b1f1-2aa357a9da87'::uuid,
		'cb58a7b2-4a94-43ed-8ee8-ef49e6000e15'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'9bdf5401-3cf5-43e5-9c2d-05670a01002d'::uuid,
		'28eb1c29-6e18-4962-968a-9cb4b5b0e8ad'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'c82c019e-36fb-477e-ad26-844843a7867c'::uuid,
		'850f3df6-2163-43b5-9393-2e937f6d6805'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'f82522fd-c431-45a0-abfb-c908386ef7ec'::uuid,
		'62c7c5ff-f706-426e-88dc-b7347295afc0'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'd7522e4f-d037-49f1-9824-3f4bdabaf899'::uuid,
		'065e599c-a32f-4118-b262-2b6267b75667'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'673ea231-3ed9-489c-992c-ad2137687149'::uuid,
		'd133cb0c-e2c6-43a2-b43b-a59009ed3a6c'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'823e276b-5221-4aab-99bc-3c3b2f0a8346'::uuid,
		'b9c13010-adcd-4754-84c8-1be1f76230a0'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'09c9f01a-13b8-4fb3-aebe-afcf1842705f'::uuid,
		'a0bfe5a4-0548-4933-a1b8-27e45eb0e14a'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'a5f50d89-293f-4899-89be-14cecb221ebc'::uuid,
		'2d472fca-257d-4a28-b0a6-e4462811f3bd'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'84434a0b-0dd3-4d42-bc28-5da54114ad87'::uuid,
		'48cba748-94ce-4e34-aac1-7d02a9d81ff4'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'4bb9abba-dbb1-406e-94ee-6e2ce4b9c8cd'::uuid,
		'ed4259e1-665a-4b09-aa9d-657015beeb9a'::uuid,
		'4e5627be-a8da-4943-aa1a-36137a040f29'::uuid,
		'member',
		'2026-04-27 03:21:53.912+00'
	),
	(
		'28fd5ece-287c-44d9-9109-4d6b359b68c7'::uuid,
		'428932b5-3e26-47be-b84f-d89208e19e90'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'bbc90409-5481-470e-9906-c27b2e86c8f1'::uuid,
		'a4832b00-31c8-4ec3-a9ed-8e22a517d1a3'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'58768ba5-f001-433b-8932-a395a6c62506'::uuid,
		'40d44ab6-a865-4230-8774-2660819eb1af'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'156e9a8a-c22d-4a27-bc49-a00b594b8dd5'::uuid,
		'b1768fd3-e36b-40f9-8881-5516e4f1c195'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'f8189c12-8346-4ac6-950d-326b24e15f37'::uuid,
		'847630b7-bf6c-4822-b3eb-0c69d525f8ec'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'0486ca18-1bf0-4227-880e-4054f8a57a47'::uuid,
		'cb58a7b2-4a94-43ed-8ee8-ef49e6000e15'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'9d856ff3-4732-4c28-8c87-54a95d518ad8'::uuid,
		'28eb1c29-6e18-4962-968a-9cb4b5b0e8ad'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'392939bf-29a6-4353-84fd-5b41179ff81e'::uuid,
		'850f3df6-2163-43b5-9393-2e937f6d6805'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'4b1fcee7-83b2-4a27-ba96-fe5f44bf36ac'::uuid,
		'ed4259e1-665a-4b09-aa9d-657015beeb9a'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'062117b1-6d9c-4690-8467-3d0ba8271216'::uuid,
		'54b3528d-d8b3-42c6-99f5-a2e76f524329'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'cd2ad839-33a7-458b-afb0-d7f51a549015'::uuid,
		'4b7521b1-a96c-463c-867e-e95094050828'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:23:03.256+00'
	),
	(
		'48b1aae5-6685-405a-b4ac-a9b4f15ddf6f'::uuid,
		'f89b521d-46e6-4ad2-a54b-628fac94d64d'::uuid,
		'e8f604c7-cbba-4406-9463-99a88a9e6199'::uuid,
		'member',
		'2026-04-27 03:24:43.202+00'
	),
	(
		'490c9ada-8426-409c-9c20-e2148f2eb3a6'::uuid,
		'40d44ab6-a865-4230-8774-2660819eb1af'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'4a30aec0-0a7f-4c77-a8ae-c87978fc96f8'::uuid,
		'0dd201a5-3d3f-4130-90c1-0d76ec410fbf'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'87a57abb-345c-46ee-a808-f168a3308787'::uuid,
		'573f4864-ccb2-4b39-ad8c-bc7bf1162bd8'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'a81bf8ec-0523-4d9d-a951-49221a0a33bc'::uuid,
		'a82c88ba-ff52-4421-b758-07c942e0c8fe'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'6edb2f49-1c16-4025-8544-1ac0e21bb773'::uuid,
		'847630b7-bf6c-4822-b3eb-0c69d525f8ec'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'f0fcd4ea-c3e7-449d-9a1c-086c3ac146b2'::uuid,
		'cb58a7b2-4a94-43ed-8ee8-ef49e6000e15'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'978e5e0d-e65c-4289-8006-3bd754c2d44a'::uuid,
		'28eb1c29-6e18-4962-968a-9cb4b5b0e8ad'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'892f4cfd-5875-4f61-8bad-5820168c5b00'::uuid,
		'850f3df6-2163-43b5-9393-2e937f6d6805'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'ac4ffd9c-7da0-4f50-aa52-ab1d37c95257'::uuid,
		'065e599c-a32f-4118-b262-2b6267b75667'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'a22a2be0-f3ea-450e-b4a6-7ebe373074f6'::uuid,
		'd133cb0c-e2c6-43a2-b43b-a59009ed3a6c'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'46bc2b37-ef3c-4691-9e78-da1beeb5b212'::uuid,
		'b9c13010-adcd-4754-84c8-1be1f76230a0'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'0e41fcbf-2b28-449c-b8fc-c5dc7f310188'::uuid,
		'ed4259e1-665a-4b09-aa9d-657015beeb9a'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'8579d2a2-1f80-476a-9518-6a81d50ad8d9'::uuid,
		'f89b521d-46e6-4ad2-a54b-628fac94d64d'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'e73c8420-c926-49f1-9712-e1aaabf94dd0'::uuid,
		'35048614-dd23-4373-bd39-6a062a6ecbc6'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'ff1572d0-31fe-4dab-97f5-292083603dbd'::uuid,
		'428932b5-3e26-47be-b84f-d89208e19e90'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'c608ceb9-c9f7-4297-ae16-73c9d91ff478'::uuid,
		'a2b33bc4-ba8c-407e-865e-367fa3f71fcf'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'7f5d1721-7e03-4253-995e-a602c5f5e4e2'::uuid,
		'7a026569-e1d9-4ead-b44c-7bf31552221d'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'e98b1b1e-e089-42bf-9c44-428dd159fee3'::uuid,
		'922ca237-bfb9-4424-8ba9-4706e8e2e200'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'4352a9f9-84fd-46fa-bf4f-41a3578b2dd8'::uuid,
		'0b31b58b-d957-4c58-947b-094cd189eeae'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'dbc2c004-2ee2-48f3-9a07-e9898340982e'::uuid,
		'1706ad23-7635-4ef9-89af-75a6382cdbb6'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'63a59e44-412b-4a65-9918-e32ae984fedd'::uuid,
		'b8054d49-2b8b-4d9d-b35c-0646893cdcf0'::uuid,
		'0b8b1d9b-6bbc-4fc8-a695-c2d2eab262c7'::uuid,
		'member',
		'2026-04-27 03:25:55.721+00'
	),
	(
		'369e6804-106f-4ef5-bc00-d9aae5897ed4'::uuid,
		'0dd201a5-3d3f-4130-90c1-0d76ec410fbf'::uuid,
		'd01a0ee9-8bc7-4984-b3d5-7ab1f95992f3'::uuid,
		'member',
		'2026-04-27 03:26:33.986+00'
	),
	(
		'9a50ac94-8d13-4ab1-87a1-320bb374182d'::uuid,
		'573f4864-ccb2-4b39-ad8c-bc7bf1162bd8'::uuid,
		'd01a0ee9-8bc7-4984-b3d5-7ab1f95992f3'::uuid,
		'member',
		'2026-04-27 03:26:33.986+00'
	),
	(
		'7c07fa3c-5fec-4ca3-b5ec-30db804c766a'::uuid,
		'b9c13010-adcd-4754-84c8-1be1f76230a0'::uuid,
		'd01a0ee9-8bc7-4984-b3d5-7ab1f95992f3'::uuid,
		'member',
		'2026-04-27 03:26:33.986+00'
	),
	(
		'd89eb00d-d7ce-4af6-bd76-5bd0f906be56'::uuid,
		'54b3528d-d8b3-42c6-99f5-a2e76f524329'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	),
	(
		'ed8f26ea-f275-4a8e-914d-c5d103982fbe'::uuid,
		'850f3df6-2163-43b5-9393-2e937f6d6805'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'c2b5c6e8-ed46-42a4-b666-4518953e51b6'::uuid,
		'b9c13010-adcd-4754-84c8-1be1f76230a0'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	),
	(
		'c7405edf-2c25-452f-b2fe-3ef7fc6668f6'::uuid,
		'2d472fca-257d-4a28-b0a6-e4462811f3bd'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	),
	(
		'0851c077-e5ef-4451-9cd1-746bf039333f'::uuid,
		'0b31b58b-d957-4c58-947b-094cd189eeae'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	),
	(
		'b3c1e064-effc-4804-a6ba-4725b0268e6d'::uuid,
		'59aa05eb-7d25-4f2e-8111-aa8251d3b66c'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	),
	(
		'6554c799-94ab-446e-8e35-84b3a76c38d6'::uuid,
		'4b7521b1-a96c-463c-867e-e95094050828'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	),
	(
		'0f22b96c-a97e-4e2c-aaa8-504984465c6a'::uuid,
		'1706ad23-7635-4ef9-89af-75a6382cdbb6'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	),
	(
		'51d4f4b1-c064-47f7-8200-f6e79b9b8f03'::uuid,
		'57af580c-3860-4739-acaf-c0c9f8474bf8'::uuid,
		'a10052c7-23ab-4f5d-9320-7b50268da37f'::uuid,
		'member',
		'2026-04-27 03:27:29.23+00'
	),
	(
		'487010f6-391f-461d-82c7-a1d675dc5de0'::uuid,
		'559e5c2e-f672-4f79-a6f5-8cacadb8b8aa'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'73b61277-4f32-4c2e-b3b2-d83c5a0cbded'::uuid,
		'428932b5-3e26-47be-b84f-d89208e19e90'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'b2e2a978-e523-483a-9b25-00a84e7eb9d7'::uuid,
		'b1768fd3-e36b-40f9-8881-5516e4f1c195'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'bfb1a9ab-b3de-4fab-84de-7fadb51d3fb8'::uuid,
		'19632ca8-8f4a-421e-9d7d-721c4a39348f'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'a9b0d8ac-292f-48b1-b968-2d5592b8a6f1'::uuid,
		'850f3df6-2163-43b5-9393-2e937f6d6805'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'488200d3-9140-4350-b69d-58ede1c07d4d'::uuid,
		'62c7c5ff-f706-426e-88dc-b7347295afc0'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'34ac0b8a-b255-4d7e-8291-fc16ce6b0e1d'::uuid,
		'065e599c-a32f-4118-b262-2b6267b75667'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'1cd6ed6e-bb15-4cb7-b6fe-cd922d3dbae3'::uuid,
		'd133cb0c-e2c6-43a2-b43b-a59009ed3a6c'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'e97de037-02db-4217-8062-2047d5ccde9f'::uuid,
		'a0bfe5a4-0548-4933-a1b8-27e45eb0e14a'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'debd48af-c22a-4b8f-9030-ed276b42b28d'::uuid,
		'ed4259e1-665a-4b09-aa9d-657015beeb9a'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'c56d45a1-976c-4408-82ae-abc49b06df39'::uuid,
		'4b7521b1-a96c-463c-867e-e95094050828'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'3914f82b-1e01-4997-add9-2aaf3eb197c4'::uuid,
		'0b31b58b-d957-4c58-947b-094cd189eeae'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	),
	(
		'102ab04b-b611-45d6-9cb7-dcd7eafcba7c'::uuid,
		'a4832b00-31c8-4ec3-a9ed-8e22a517d1a3'::uuid,
		'5d53d603-598b-49ab-8df0-9a60df92eefa'::uuid,
		'member',
		'2026-04-27 03:28:47.965+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'da83b65b-7dea-4464-98ef-0c138e598e8f'::uuid,
		'54b3528d-d8b3-42c6-99f5-a2e76f524329'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'4558ea20-332a-4c58-a9c8-1705a75e431e'::uuid,
		'559e5c2e-f672-4f79-a6f5-8cacadb8b8aa'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'f314d80e-e025-42a1-bc15-68a87186c4fb'::uuid,
		'a4832b00-31c8-4ec3-a9ed-8e22a517d1a3'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'731ef4f5-6e02-4c1e-a611-aee7ee206a15'::uuid,
		'b1768fd3-e36b-40f9-8881-5516e4f1c195'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'e79b7daf-cc59-4672-8feb-91d74d3518e9'::uuid,
		'19632ca8-8f4a-421e-9d7d-721c4a39348f'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'eb4beecd-0534-4dcd-97d8-cce051ad5923'::uuid,
		'62c7c5ff-f706-426e-88dc-b7347295afc0'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'76d9990c-005b-4546-9fff-400f05153c5a'::uuid,
		'a0bfe5a4-0548-4933-a1b8-27e45eb0e14a'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'7345ee67-2e60-4a44-9d38-35400fba8502'::uuid,
		'2d472fca-257d-4a28-b0a6-e4462811f3bd'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'2fb00c3d-03fc-4da3-9314-c6b5391dc976'::uuid,
		'48cba748-94ce-4e34-aac1-7d02a9d81ff4'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'f50b17c0-78cf-4d6c-a709-f6ef96b3a038'::uuid,
		'4b7521b1-a96c-463c-867e-e95094050828'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'33bc141e-f6f1-4533-ba17-3f2d5427f4f1'::uuid,
		'59aa05eb-7d25-4f2e-8111-aa8251d3b66c'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'711f01e0-c4c8-478f-98d4-9ba898e6a52b'::uuid,
		'57af580c-3860-4739-acaf-c0c9f8474bf8'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'35c821fc-9332-4a6b-9e75-95a7c70007cf'::uuid,
		'7b751d0f-2264-47dc-a591-c0cd7cdf3d2a'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'9f261a48-3e8b-4f1b-99e1-495c3da8f124'::uuid,
		'80190d83-4a0d-47e4-bb81-9ad12a918ca0'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'd452fd7c-9758-4ec3-a3f9-58c5f55d7d2e'::uuid,
		'273ee85c-f299-4252-a275-d82e72ffe2be'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'9537bf0f-9717-4baa-bc8b-8611117eaa79'::uuid,
		'1ecf05e3-e943-477b-bcbf-231b8a1a8988'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'129c53c0-0be9-4a54-8db2-4d34cf1f7b11'::uuid,
		'87e9b01f-c9a4-4d24-9dda-f8fb04a0ffe9'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'5676f745-14b5-4ea1-927d-874b193571d5'::uuid,
		'4a309066-8121-4b9f-9097-21659ed3a655'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'5426c382-2dfb-41f2-b075-e71514f83504'::uuid,
		'95b2ebbb-812f-4e9c-ac5b-bf11531c1382'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	),
	(
		'35fa6a74-6e24-4b57-b702-11f9224e49eb'::uuid,
		'5c4f4f3a-fdb1-49f3-8ff4-984bfd87c9b1'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	);
INSERT INTO public.member_groups (id, user_id, group_id, "role", joined_at)
VALUES (
		'8aa0782f-a880-494a-ad33-5e86af48c579'::uuid,
		'c0fb8ca9-1a4d-4df0-8984-de025f1905a0'::uuid,
		'8130f782-27a8-428e-b44e-6eef03e756a1'::uuid,
		'member',
		'2026-04-27 03:30:28.761+00'
	);
INSERT INTO public.profiles (
		id,
		user_id,
		full_name,
		avatar_url,
		whatsapp_phone,
		username,
		created_at,
		updated_at
	)
VALUES (
		'ff648202-84d6-4b8a-8b36-0c5bb56a1b49'::uuid,
		'c52bc81a-0473-4731-b01a-ece82d298c43'::uuid,
		'Cris',
		'/api/uploads/4df15729-7d98-4395-97c1-4bcb04d0cf98.jpg',
		NULL,
		'cris',
		'2026-04-26 19:28:32.907+00',
		'2026-04-26 21:42:27.623+00'
	),
	(
		'4f6d57c9-dfba-4a75-a16f-e759b081f29d'::uuid,
		'0b31b58b-d957-4c58-947b-094cd189eeae'::uuid,
		'Márcio Lopes',
		NULL,
		'558597763630',
		'pastor',
		'2026-04-26 23:51:00.658+00',
		'2026-04-26 23:51:00.658+00'
	),
	(
		'4a7d5234-72c9-4df0-b2e0-32e18d188bfe'::uuid,
		'850f3df6-2163-43b5-9393-2e937f6d6805'::uuid,
		'Matheus Silva',
		NULL,
		'558586500015',
		'matheus',
		'2026-04-27 01:19:58.344+00',
		'2026-04-27 01:19:58.344+00'
	),
	(
		'2e941b89-122e-404a-ba5e-c167713bd9b0'::uuid,
		'4b7521b1-a96c-463c-867e-e95094050828'::uuid,
		'Letícia Ribeiro',
		NULL,
		'558598365650',
		'leticia',
		'2026-04-27 01:20:29.454+00',
		'2026-04-27 01:20:29.454+00'
	),
	(
		'd52df8d8-2f29-45c5-9499-547e42662f26'::uuid,
		'ed4259e1-665a-4b09-aa9d-657015beeb9a'::uuid,
		'Welder Ribeiro',
		NULL,
		'558592361747',
		'welder',
		'2026-04-27 01:21:38.241+00',
		'2026-04-27 01:21:38.241+00'
	),
	(
		'76c08c0b-ceda-410c-83cd-0b075111e78e'::uuid,
		'b9c13010-adcd-4754-84c8-1be1f76230a0'::uuid,
		'Renato Vitor',
		NULL,
		'558586606669',
		'renato',
		'2026-04-26 22:49:19.568+00',
		'2026-04-27 01:22:10.527+00'
	),
	(
		'89b35e2b-bfff-4d08-86dd-47ede87467f7'::uuid,
		'd133cb0c-e2c6-43a2-b43b-a59009ed3a6c'::uuid,
		'Pedro Leonardo',
		NULL,
		NULL,
		'p.leo',
		'2026-04-27 01:23:26.249+00',
		'2026-04-27 01:23:26.249+00'
	),
	(
		'5b4592f9-9525-454f-8adc-8d0f22435902'::uuid,
		'54b3528d-d8b3-42c6-99f5-a2e76f524329'::uuid,
		'Cecília Brauna',
		NULL,
		'558596360914',
		'cecilia',
		'2026-04-27 01:24:03.768+00',
		'2026-04-27 01:24:03.768+00'
	),
	(
		'bb2c5752-5c9c-4e6c-89c2-091b1fc55b53'::uuid,
		'cb58a7b2-4a94-43ed-8ee8-ef49e6000e15'::uuid,
		'Kelvison',
		NULL,
		'558598181202',
		'kelvison',
		'2026-04-27 01:25:32.762+00',
		'2026-04-27 01:25:32.762+00'
	),
	(
		'05248c61-21f5-4fe3-82fc-ea6aa4ef245a'::uuid,
		'59aa05eb-7d25-4f2e-8111-aa8251d3b66c'::uuid,
		'Francinar',
		NULL,
		'558599390255',
		'fran',
		'2026-04-27 01:26:23.264+00',
		'2026-04-27 01:26:23.264+00'
	);
INSERT INTO public.profiles (
		id,
		user_id,
		full_name,
		avatar_url,
		whatsapp_phone,
		username,
		created_at,
		updated_at
	)
VALUES (
		'c83185c1-e2ad-42af-bbb0-f041bf8f0ced'::uuid,
		'b1768fd3-e36b-40f9-8881-5516e4f1c195'::uuid,
		'Isabelly',
		NULL,
		'558594530704',
		'isabelly',
		'2026-04-27 01:26:51.445+00',
		'2026-04-27 01:26:51.445+00'
	),
	(
		'3ce045d8-8492-42e6-b009-5f925993ba6b'::uuid,
		'35048614-dd23-4373-bd39-6a062a6ecbc6'::uuid,
		'Arnor',
		NULL,
		'558586768320',
		'arnor',
		'2026-04-27 01:27:27.247+00',
		'2026-04-27 01:27:27.247+00'
	),
	(
		'77b4859c-4a61-457d-9b46-d8571d645c56'::uuid,
		'428932b5-3e26-47be-b84f-d89208e19e90'::uuid,
		'Douglas',
		NULL,
		'558592218908',
		'douglas',
		'2026-04-27 01:27:50.937+00',
		'2026-04-27 01:27:50.937+00'
	),
	(
		'4c26dd30-9d9b-4c9e-bfb5-6e2fd8df27ba'::uuid,
		'a4832b00-31c8-4ec3-a9ed-8e22a517d1a3'::uuid,
		'Ester',
		NULL,
		'558599169966',
		'ester',
		'2026-04-27 01:28:10.438+00',
		'2026-04-27 01:28:10.438+00'
	),
	(
		'7f1adae9-373c-4aa9-b8b2-2d81616415a2'::uuid,
		'a2b33bc4-ba8c-407e-865e-367fa3f71fcf'::uuid,
		'Felipe Silva',
		NULL,
		'558596135183',
		'felipe',
		'2026-04-27 01:28:33.036+00',
		'2026-04-27 01:28:33.036+00'
	),
	(
		'80e905ac-ad6c-4ac1-9d09-a4ddf8430404'::uuid,
		'0dd201a5-3d3f-4130-90c1-0d76ec410fbf'::uuid,
		'Gabriel Nascimento',
		NULL,
		'558587596022',
		'gabriel',
		'2026-04-27 01:29:01.945+00',
		'2026-04-27 01:29:01.945+00'
	),
	(
		'7367445d-3820-4b5e-8c66-7ab013dc71aa'::uuid,
		'847630b7-bf6c-4822-b3eb-0c69d525f8ec'::uuid,
		'Kalebe Guedes',
		NULL,
		'558597572996',
		'kalebe',
		'2026-04-27 01:29:33.633+00',
		'2026-04-27 01:29:33.633+00'
	),
	(
		'c920b706-6189-43a2-b951-821632bb92c1'::uuid,
		'40d44ab6-a865-4230-8774-2660819eb1af'::uuid,
		'Guilherme Alexandre',
		NULL,
		'558594048086',
		'guilherme',
		'2026-04-27 01:30:01.049+00',
		'2026-04-27 01:30:01.049+00'
	),
	(
		'd8bf4052-34c1-4eeb-b7a1-2315a6692480'::uuid,
		'573f4864-ccb2-4b39-ad8c-bc7bf1162bd8'::uuid,
		'Gustavo',
		NULL,
		'558585443856',
		'gustavo',
		'2026-04-27 01:30:18.933+00',
		'2026-04-27 01:30:18.933+00'
	),
	(
		'2b0af6b7-6c2c-447f-b3d1-5b0283cc386b'::uuid,
		'19632ca8-8f4a-421e-9d7d-721c4a39348f'::uuid,
		'Izabel Cristina',
		NULL,
		'558586986353',
		'izabel',
		'2026-04-27 01:30:43.644+00',
		'2026-04-27 01:30:43.644+00'
	);
INSERT INTO public.profiles (
		id,
		user_id,
		full_name,
		avatar_url,
		whatsapp_phone,
		username,
		created_at,
		updated_at
	)
VALUES (
		'71cbf82d-89ad-408e-a1a9-32b05413144a'::uuid,
		'7a026569-e1d9-4ead-b44c-7bf31552221d'::uuid,
		'Jhony',
		NULL,
		'558584173115',
		'jhony',
		'2026-04-27 01:31:14.335+00',
		'2026-04-27 01:31:14.335+00'
	),
	(
		'5dff6872-2b44-4529-b516-c594b52159c9'::uuid,
		'28eb1c29-6e18-4962-968a-9cb4b5b0e8ad'::uuid,
		'Levy',
		NULL,
		'558586533624',
		'levy',
		'2026-04-27 01:31:33.24+00',
		'2026-04-27 01:31:33.24+00'
	),
	(
		'cafa594b-c32b-4528-983a-d768237fe31f'::uuid,
		'7b751d0f-2264-47dc-a591-c0cd7cdf3d2a'::uuid,
		'Maria Lúcia',
		NULL,
		'558586026041',
		'marialucia',
		'2026-04-27 01:32:06.235+00',
		'2026-04-27 01:32:06.235+00'
	),
	(
		'c192dfbd-7ed2-4130-856a-e5976cc8e16f'::uuid,
		'80190d83-4a0d-47e4-bb81-9ad12a918ca0'::uuid,
		'Marília',
		NULL,
		'558585114614',
		'marilia',
		'2026-04-27 01:32:28.337+00',
		'2026-04-27 01:32:28.337+00'
	),
	(
		'541b1e9e-4563-40b2-9c3b-af690ecfb563'::uuid,
		'273ee85c-f299-4252-a275-d82e72ffe2be'::uuid,
		'Meiry Vasconcelos',
		NULL,
		'558599749781',
		'meiry',
		'2026-04-27 01:32:57.031+00',
		'2026-04-27 01:32:57.031+00'
	),
	(
		'e520f7af-5254-4d4a-9777-58f428b2eee7'::uuid,
		'62c7c5ff-f706-426e-88dc-b7347295afc0'::uuid,
		'Melina',
		NULL,
		'558597448488',
		'melina',
		'2026-04-27 01:33:17.15+00',
		'2026-04-27 01:33:17.15+00'
	),
	(
		'9859f0e0-f408-456b-b4f2-fc13f733da47'::uuid,
		'065e599c-a32f-4118-b262-2b6267b75667'::uuid,
		'Miguel',
		NULL,
		'558592878565',
		'miguel',
		'2026-04-27 01:33:41.646+00',
		'2026-04-27 01:33:41.646+00'
	),
	(
		'c6dbb92f-d14a-4ae3-ace7-43315d3c253f'::uuid,
		'87e9b01f-c9a4-4d24-9dda-f8fb04a0ffe9'::uuid,
		'Nielly Silva',
		NULL,
		'558585202974',
		'nielly',
		'2026-04-27 01:34:05.234+00',
		'2026-04-27 01:34:05.234+00'
	),
	(
		'1841e462-0a76-4827-ae82-f8d66ef3f233'::uuid,
		'1706ad23-7635-4ef9-89af-75a6382cdbb6'::uuid,
		'Pedro Moreira',
		NULL,
		'558586770868',
		'pedromoreira',
		'2026-04-27 01:34:28.844+00',
		'2026-04-27 01:34:28.844+00'
	),
	(
		'5520d945-ba6a-4300-9bd9-cea1c1b3f013'::uuid,
		'4a309066-8121-4b9f-9097-21659ed3a655'::uuid,
		'Penha',
		NULL,
		'558588389951',
		'penha',
		'2026-04-27 01:34:49.616+00',
		'2026-04-27 01:34:49.616+00'
	);
INSERT INTO public.profiles (
		id,
		user_id,
		full_name,
		avatar_url,
		whatsapp_phone,
		username,
		created_at,
		updated_at
	)
VALUES (
		'ca3bcf99-18ea-468a-9d17-bb949c928890'::uuid,
		'95b2ebbb-812f-4e9c-ac5b-bf11531c1382'::uuid,
		'Raimunda',
		NULL,
		'558594212818',
		'raimunda',
		'2026-04-27 01:35:08.236+00',
		'2026-04-27 01:35:08.236+00'
	),
	(
		'd2b16a7d-92cc-4a6f-9432-27e817cbff8f'::uuid,
		'57af580c-3860-4739-acaf-c0c9f8474bf8'::uuid,
		'Rogelma',
		NULL,
		'558584220340',
		'rogelma',
		'2026-04-27 01:35:34.285+00',
		'2026-04-27 01:35:34.285+00'
	),
	(
		'7e4751f2-13a7-495f-8dd7-29eb5a951a07'::uuid,
		'5c4f4f3a-fdb1-49f3-8ff4-984bfd87c9b1'::uuid,
		'Rosimeire Ferreira',
		NULL,
		'558586551806',
		'rosimeire',
		'2026-04-27 01:35:54.738+00',
		'2026-04-27 01:35:54.738+00'
	),
	(
		'3b979d5b-267b-44e1-9838-1528e358b0f2'::uuid,
		'a0bfe5a4-0548-4933-a1b8-27e45eb0e14a'::uuid,
		'Samya',
		NULL,
		'558582058887',
		'samya',
		'2026-04-27 01:36:15.936+00',
		'2026-04-27 01:36:15.936+00'
	),
	(
		'a5839c5c-fc16-41ce-af62-a3e6281ed0da'::uuid,
		'559e5c2e-f672-4f79-a6f5-8cacadb8b8aa'::uuid,
		'Clara Letícia',
		NULL,
		'558597785765',
		'clara',
		'2026-04-27 01:36:42.635+00',
		'2026-04-27 01:36:42.635+00'
	),
	(
		'8da25f93-f4ba-4320-8347-f817f86b0bb5'::uuid,
		'2d472fca-257d-4a28-b0a6-e4462811f3bd'::uuid,
		'Taty Silva',
		NULL,
		'558521620969',
		'taty',
		'2026-04-27 01:37:23.961+00',
		'2026-04-27 01:37:23.961+00'
	),
	(
		'a06f42f3-c0da-472e-8aa5-125f7df5bc55'::uuid,
		'c0fb8ca9-1a4d-4df0-8984-de025f1905a0'::uuid,
		'Terezinha',
		NULL,
		'558591435083',
		'terezinha',
		'2026-04-27 01:37:43.566+00',
		'2026-04-27 01:37:43.566+00'
	),
	(
		'7f66f22a-034a-4062-87aa-267e62a0a385'::uuid,
		'b8054d49-2b8b-4d9d-b35c-0646893cdcf0'::uuid,
		'Thyago Silva',
		NULL,
		'558587985564',
		'thyago',
		'2026-04-27 01:38:06.335+00',
		'2026-04-27 01:38:06.335+00'
	),
	(
		'ad08c438-8c28-4285-8053-b43814f61e49'::uuid,
		'922ca237-bfb9-4424-8ba9-4706e8e2e200'::uuid,
		'Leandro',
		NULL,
		'558586420792',
		'leandro',
		'2026-04-27 01:38:26.456+00',
		'2026-04-27 01:38:26.456+00'
	),
	(
		'd8986ebf-08f1-4d5d-b4d3-a457259babb1'::uuid,
		'48cba748-94ce-4e34-aac1-7d02a9d81ff4'::uuid,
		'Thaynara',
		NULL,
		'558592361747',
		'thaynara',
		'2026-04-26 19:44:41.634+00',
		'2026-04-27 01:38:44.312+00'
	);
INSERT INTO public.profiles (
		id,
		user_id,
		full_name,
		avatar_url,
		whatsapp_phone,
		username,
		created_at,
		updated_at
	)
VALUES (
		'87cf8f26-f767-477d-ae08-8a524d70bdf7'::uuid,
		'23693b0e-02ab-4f4d-8a97-1bec4e258477'::uuid,
		'A identificar',
		NULL,
		'558587932702',
		'semnome01',
		'2026-04-27 01:39:22.048+00',
		'2026-04-27 01:39:22.048+00'
	),
	(
		'd6615b00-eeac-4101-8e55-10b1c6f7db53'::uuid,
		'b20ec0e2-6f3e-4051-b63c-65d040c889d1'::uuid,
		'A identificar 02',
		NULL,
		'558589162327',
		'semnome02',
		'2026-04-27 01:39:49.367+00',
		'2026-04-27 01:39:49.367+00'
	),
	(
		'dc563fa1-6f24-4017-933c-b380e9a2b48f'::uuid,
		'4f349bc9-b198-4199-836e-527c58d6a980'::uuid,
		'A identificar 03',
		NULL,
		'558596171443',
		'semnome03',
		'2026-04-27 01:40:26.563+00',
		'2026-04-27 01:40:26.563+00'
	),
	(
		'2e1e0e37-712e-4c9b-a876-544d5932214e'::uuid,
		'a82c88ba-ff52-4421-b758-07c942e0c8fe'::uuid,
		'Jhony 2',
		NULL,
		'558582002306',
		'jhonny',
		'2026-04-27 01:41:01.062+00',
		'2026-04-27 01:41:01.062+00'
	),
	(
		'a2cfbaf5-f0b6-4d18-a293-ca3441675f86'::uuid,
		'1ecf05e3-e943-477b-bcbf-231b8a1a8988'::uuid,
		'Mily',
		NULL,
		'558588069598',
		'mily',
		'2026-04-27 01:41:18.54+00',
		'2026-04-27 01:41:18.54+00'
	),
	(
		'6cc19bc0-49a9-41bc-958f-f1dcb29b085a'::uuid,
		'f2ec7429-e00b-4b3c-a7b1-f99aab8922d4'::uuid,
		'Jarde',
		NULL,
		'558585029634',
		'jarde',
		'2026-04-26 19:58:10.85+00',
		'2026-04-27 03:20:41.89+00'
	),
	(
		'67d15a3c-c547-4760-82c6-469f5a529f50'::uuid,
		'f89b521d-46e6-4ad2-a54b-628fac94d64d'::uuid,
		'Lucas ',
		NULL,
		'558598010054',
		'lucas',
		'2026-04-27 03:24:42.779+00',
		'2026-04-27 03:24:42.779+00'
	);
INSERT INTO public.site_settings (id, value, updated_at)
VALUES (
		'about_us_video_url',
		'https://youtu.be/N31uzq-UGdw?si=ofrGHzRmf9D5q90k',
		'2026-04-27 01:44:24.358+00'
	),
	(
		'about_us_video_is_upload',
		'false',
		'2026-04-27 01:44:25.565+00'
	),
	(
		'whatsapp_number',
		'85989866075',
		'2026-04-27 01:45:29.8+00'
	),
	(
		'instagram_url',
		'https://www.instagram.com/ccmergulho?igsh=bHE0eDAzNm11enR0',
		'2026-04-27 01:45:30.938+00'
	),
	('facebook_url', '', '2026-04-27 01:45:32.089+00'),
	(
		'pix_key',
		'19.017.873/0002-16',
		'2026-04-27 01:45:33.253+00'
	),
	(
		'maps_embed_url',
		'',
		'2026-04-27 01:45:34.51+00'
	);
INSERT INTO public.user_roles (id, user_id, "role")
VALUES (
		'3f8b6b31-b812-49dc-8711-803df3f1b411'::uuid,
		'c52bc81a-0473-4731-b01a-ece82d298c43'::uuid,
		'admin_ccm'::public.app_role
	),
	(
		'4a035fbd-bca0-40f4-ad27-378b7bff05af'::uuid,
		'0b31b58b-d957-4c58-947b-094cd189eeae'::uuid,
		'pastor'::public.app_role
	),
	(
		'0343f2e4-cbeb-4b21-a58b-10820e1acd99'::uuid,
		'850f3df6-2163-43b5-9393-2e937f6d6805'::uuid,
		'lider'::public.app_role
	),
	(
		'6c74cc6b-4ce0-4f82-af9c-41c599cf7edb'::uuid,
		'4b7521b1-a96c-463c-867e-e95094050828'::uuid,
		'lider'::public.app_role
	),
	(
		'f604856b-046a-4184-a4a7-3a7369e4fcd1'::uuid,
		'ed4259e1-665a-4b09-aa9d-657015beeb9a'::uuid,
		'membro'::public.app_role
	),
	(
		'04dd7aba-d66b-4375-8ac8-8abfb0e1a9ff'::uuid,
		'b9c13010-adcd-4754-84c8-1be1f76230a0'::uuid,
		'lider'::public.app_role
	),
	(
		'62c58a26-dbe8-40c1-9f4f-e5dacb5dba55'::uuid,
		'd133cb0c-e2c6-43a2-b43b-a59009ed3a6c'::uuid,
		'membro'::public.app_role
	),
	(
		'd563374e-670f-4ad4-85a5-6d49dd6ba0a0'::uuid,
		'54b3528d-d8b3-42c6-99f5-a2e76f524329'::uuid,
		'lider'::public.app_role
	),
	(
		'a763e13e-4cb1-4e1d-b12e-5717f017c3fc'::uuid,
		'cb58a7b2-4a94-43ed-8ee8-ef49e6000e15'::uuid,
		'membro'::public.app_role
	),
	(
		'807192a6-6ac9-405b-9fd0-26b5b37895e2'::uuid,
		'59aa05eb-7d25-4f2e-8111-aa8251d3b66c'::uuid,
		'pastor'::public.app_role
	);
INSERT INTO public.user_roles (id, user_id, "role")
VALUES (
		'ce8b5e4a-daa5-44c8-8085-5f5b11456347'::uuid,
		'b1768fd3-e36b-40f9-8881-5516e4f1c195'::uuid,
		'membro'::public.app_role
	),
	(
		'cdf2ca96-2e86-47dc-94af-3d8eb4219db2'::uuid,
		'35048614-dd23-4373-bd39-6a062a6ecbc6'::uuid,
		'membro'::public.app_role
	),
	(
		'08fe098f-3c8d-4202-8e05-56e58d8ee2a8'::uuid,
		'428932b5-3e26-47be-b84f-d89208e19e90'::uuid,
		'membro'::public.app_role
	),
	(
		'56a10d2c-09a8-460c-82d5-5c0d0df9659f'::uuid,
		'a4832b00-31c8-4ec3-a9ed-8e22a517d1a3'::uuid,
		'membro'::public.app_role
	),
	(
		'22286b55-0d3f-438e-8412-ad1cced56914'::uuid,
		'a2b33bc4-ba8c-407e-865e-367fa3f71fcf'::uuid,
		'membro'::public.app_role
	),
	(
		'9211717f-c07f-4486-a10d-9ca36764ff50'::uuid,
		'0dd201a5-3d3f-4130-90c1-0d76ec410fbf'::uuid,
		'membro'::public.app_role
	),
	(
		'f3b18c79-cb5c-49b2-9491-b003aee51e23'::uuid,
		'847630b7-bf6c-4822-b3eb-0c69d525f8ec'::uuid,
		'membro'::public.app_role
	),
	(
		'e05c2f35-c696-428e-aca0-962f99f05e0b'::uuid,
		'40d44ab6-a865-4230-8774-2660819eb1af'::uuid,
		'membro'::public.app_role
	),
	(
		'223e2bd9-15ed-4c11-88d5-3cac8018afe9'::uuid,
		'573f4864-ccb2-4b39-ad8c-bc7bf1162bd8'::uuid,
		'membro'::public.app_role
	),
	(
		'1aca3125-763e-49ae-aba4-ce77d5b5682c'::uuid,
		'19632ca8-8f4a-421e-9d7d-721c4a39348f'::uuid,
		'membro'::public.app_role
	);
INSERT INTO public.user_roles (id, user_id, "role")
VALUES (
		'ce10a6e0-3518-499c-aeb4-43edc302f548'::uuid,
		'7a026569-e1d9-4ead-b44c-7bf31552221d'::uuid,
		'membro'::public.app_role
	),
	(
		'a8ea4edf-c3d6-48cb-b897-245d0ac27e8f'::uuid,
		'28eb1c29-6e18-4962-968a-9cb4b5b0e8ad'::uuid,
		'membro'::public.app_role
	),
	(
		'5b43baad-aeaa-42ca-842b-992b9ca728fb'::uuid,
		'7b751d0f-2264-47dc-a591-c0cd7cdf3d2a'::uuid,
		'membro'::public.app_role
	),
	(
		'975e21fd-e146-4a25-b095-30c28f6b0920'::uuid,
		'80190d83-4a0d-47e4-bb81-9ad12a918ca0'::uuid,
		'membro'::public.app_role
	),
	(
		'1c30c62c-dd69-4d75-aeb6-94f24040f80c'::uuid,
		'273ee85c-f299-4252-a275-d82e72ffe2be'::uuid,
		'membro'::public.app_role
	),
	(
		'125726db-0274-4aac-97d5-ad84621d66b7'::uuid,
		'62c7c5ff-f706-426e-88dc-b7347295afc0'::uuid,
		'membro'::public.app_role
	),
	(
		'aaac73a2-1f54-4c48-8597-f7f39e63808c'::uuid,
		'065e599c-a32f-4118-b262-2b6267b75667'::uuid,
		'membro'::public.app_role
	),
	(
		'ad5dc9f9-b695-4a7f-974f-041678334e8f'::uuid,
		'87e9b01f-c9a4-4d24-9dda-f8fb04a0ffe9'::uuid,
		'membro'::public.app_role
	),
	(
		'a7055fce-5340-41eb-b5b7-6e33ceec7d4c'::uuid,
		'1706ad23-7635-4ef9-89af-75a6382cdbb6'::uuid,
		'membro'::public.app_role
	),
	(
		'79c59603-acfb-40dd-b74f-e424a070fafa'::uuid,
		'4a309066-8121-4b9f-9097-21659ed3a655'::uuid,
		'membro'::public.app_role
	);
INSERT INTO public.user_roles (id, user_id, "role")
VALUES (
		'1f8ba0f0-27d8-460d-87aa-7501ec8cfbc8'::uuid,
		'95b2ebbb-812f-4e9c-ac5b-bf11531c1382'::uuid,
		'membro'::public.app_role
	),
	(
		'dec82822-e970-4442-9763-793220664db4'::uuid,
		'57af580c-3860-4739-acaf-c0c9f8474bf8'::uuid,
		'membro'::public.app_role
	),
	(
		'c1088544-9130-45af-90ab-bffddb483a98'::uuid,
		'5c4f4f3a-fdb1-49f3-8ff4-984bfd87c9b1'::uuid,
		'membro'::public.app_role
	),
	(
		'fdf21918-e358-4bb1-a864-e082648c13d8'::uuid,
		'a0bfe5a4-0548-4933-a1b8-27e45eb0e14a'::uuid,
		'membro'::public.app_role
	),
	(
		'8d6cc83d-f787-4b90-8573-0acba1a6ac06'::uuid,
		'559e5c2e-f672-4f79-a6f5-8cacadb8b8aa'::uuid,
		'membro'::public.app_role
	),
	(
		'3f03ee6c-0b2b-47df-b1a3-7dc5d47aa0a1'::uuid,
		'2d472fca-257d-4a28-b0a6-e4462811f3bd'::uuid,
		'lider'::public.app_role
	),
	(
		'1083bad4-1f71-4e6c-be94-ae54e912d117'::uuid,
		'c0fb8ca9-1a4d-4df0-8984-de025f1905a0'::uuid,
		'membro'::public.app_role
	),
	(
		'e0cfdefd-db19-4c5e-9080-de0e8fa76eea'::uuid,
		'b8054d49-2b8b-4d9d-b35c-0646893cdcf0'::uuid,
		'membro'::public.app_role
	),
	(
		'835ca690-413f-47a6-8b82-a260edcb9f9f'::uuid,
		'922ca237-bfb9-4424-8ba9-4706e8e2e200'::uuid,
		'membro'::public.app_role
	),
	(
		'41c87307-8d33-4879-83dd-a550ecc65d18'::uuid,
		'48cba748-94ce-4e34-aac1-7d02a9d81ff4'::uuid,
		'membro'::public.app_role
	);
INSERT INTO public.user_roles (id, user_id, "role")
VALUES (
		'2416a001-a8b9-47b9-8565-55d397e872a2'::uuid,
		'23693b0e-02ab-4f4d-8a97-1bec4e258477'::uuid,
		'membro'::public.app_role
	),
	(
		'05c473e3-3335-40da-94f3-5d3fcc4fe043'::uuid,
		'b20ec0e2-6f3e-4051-b63c-65d040c889d1'::uuid,
		'membro'::public.app_role
	),
	(
		'b31e962c-4c3d-431b-ada3-ef1b74ec5215'::uuid,
		'4f349bc9-b198-4199-836e-527c58d6a980'::uuid,
		'membro'::public.app_role
	),
	(
		'99dc07ce-e314-40c1-86f3-1a0d14594cbc'::uuid,
		'a82c88ba-ff52-4421-b758-07c942e0c8fe'::uuid,
		'membro'::public.app_role
	),
	(
		'3f81f278-cbd1-4bfb-b115-abb1ffc917f8'::uuid,
		'1ecf05e3-e943-477b-bcbf-231b8a1a8988'::uuid,
		'membro'::public.app_role
	),
	(
		'f4b3c110-b8ce-4c69-ac41-f042ee3cb8a5'::uuid,
		'f2ec7429-e00b-4b3c-a7b1-f99aab8922d4'::uuid,
		'admin_ccm'::public.app_role
	),
	(
		'782a9e47-ea39-4dc3-a593-85b69de7f6e3'::uuid,
		'f89b521d-46e6-4ad2-a54b-628fac94d64d'::uuid,
		'membro'::public.app_role
	);
INSERT INTO public.users (id, email, "password", created_at)
VALUES (
		'c52bc81a-0473-4731-b01a-ece82d298c43'::uuid,
		'cris@ccmergulho.com',
		'$2b$10$ANjQf9qzbo78u5JgZ5eGnusMXuEtuOw41HWdpep6VP5MYd4b1csLu',
		'2026-04-26 19:28:32.295+00'
	),
	(
		'0b31b58b-d957-4c58-947b-094cd189eeae'::uuid,
		'pastor@ccmergulho.com',
		'$2b$10$K8rZRCgrBf50Q.UQ2YVa7ONl5bMgmMvyCmpHIkM5tezyBjB3T9Q9i',
		'2026-04-26 23:51:00.518+00'
	),
	(
		'850f3df6-2163-43b5-9393-2e937f6d6805'::uuid,
		'matheus@ccmergulho.com',
		'$2b$10$aQ38GdZKkExW3WPUZCbxIePf47mYX7zdY9Ac/YxOtcnxPWIO95mta',
		'2026-04-27 01:19:58.214+00'
	),
	(
		'4b7521b1-a96c-463c-867e-e95094050828'::uuid,
		'leticia@ccmergulho.com',
		'$2b$10$hgbFF9tKLJm0PO0XNjZfaOwpC/U4dkTdHHOWrrcGgenhhLZFcOCBW',
		'2026-04-27 01:20:29.317+00'
	),
	(
		'ed4259e1-665a-4b09-aa9d-657015beeb9a'::uuid,
		'welder@ccmergulho.com',
		'$2b$10$ssqSbbBJDMjErtd1Um77seq85vLjDJjaURLRk0YjugyIJcim8eDvK',
		'2026-04-27 01:21:38.114+00'
	),
	(
		'b9c13010-adcd-4754-84c8-1be1f76230a0'::uuid,
		'renato@ccmergulho.com',
		'$2b$10$0O5RN3A1d2PpK.8N7rS6COzUhzJfIvVSU8gYGa55i270cRKtGezpm',
		'2026-04-26 22:49:19.423+00'
	),
	(
		'd133cb0c-e2c6-43a2-b43b-a59009ed3a6c'::uuid,
		'p.leo@ccmergulho.com',
		'$2b$10$BnlcngU8BoY7fnS.NUClwu/ZSZ1W6P9Y9N7PE0dS0PrLqjfVA3Ds.',
		'2026-04-27 01:23:26.114+00'
	),
	(
		'54b3528d-d8b3-42c6-99f5-a2e76f524329'::uuid,
		'cecilia@ccmergulho.com',
		'$2b$10$80erIrll45dmqxDLPaf4VOMYLPsk9L84x8D37q3yTIU8Ho/eTRspq',
		'2026-04-27 01:24:03.626+00'
	),
	(
		'cb58a7b2-4a94-43ed-8ee8-ef49e6000e15'::uuid,
		'kelvison@ccmergulho.com',
		'$2b$10$6HYS4mTJooHUTDpQIQYwcO5vBErUG6L1pZSJoM/4aT94fNH4Zt2Yq',
		'2026-04-27 01:25:32.626+00'
	),
	(
		'59aa05eb-7d25-4f2e-8111-aa8251d3b66c'::uuid,
		'fran@ccmergulho.com',
		'$2b$10$ojIsE6VG7n88jcv3TG1ex.GDkx3Gk.nRas9vl8FcYFC3ksetkIhUK',
		'2026-04-27 01:26:23.126+00'
	);
INSERT INTO public.users (id, email, "password", created_at)
VALUES (
		'b1768fd3-e36b-40f9-8881-5516e4f1c195'::uuid,
		'isabelly@ccmergulho.com',
		'$2b$10$FUOXtpGg.x8KSw.MRoVGkO8gXBsEfNtIxIK5/wm5/5GfRpnHz2OtC',
		'2026-04-27 01:26:51.315+00'
	),
	(
		'35048614-dd23-4373-bd39-6a062a6ecbc6'::uuid,
		'arnor@ccmergulho.com',
		'$2b$10$oVul/bSt5ffpiotB.0CsgOFRuHeECqF1My3JEuCm91n8UDlHGes/i',
		'2026-04-27 01:27:27.119+00'
	),
	(
		'428932b5-3e26-47be-b84f-d89208e19e90'::uuid,
		'douglas@ccmergulho.com',
		'$2b$10$nA4isZ0EJe/Jg16NjsS9YukJYp99sKcWehcC7HRT6gJEe2mfGtyDm',
		'2026-04-27 01:27:50.811+00'
	),
	(
		'a4832b00-31c8-4ec3-a9ed-8e22a517d1a3'::uuid,
		'ester@ccmergulho.com',
		'$2b$10$fsd2SUCV3uFSUrFczP44peZFgWzSepFPf69KxSIkCblmAE8SnZQ0y',
		'2026-04-27 01:28:10.312+00'
	),
	(
		'a2b33bc4-ba8c-407e-865e-367fa3f71fcf'::uuid,
		'felipe@ccmergulho.com',
		'$2b$10$DFw3uj5KC8.d1jgs7nEyTewAEujOwmxbFZXj5BsRDXGGmn9mRkVqm',
		'2026-04-27 01:28:32.912+00'
	),
	(
		'0dd201a5-3d3f-4130-90c1-0d76ec410fbf'::uuid,
		'gabriel@ccmergulho.com',
		'$2b$10$cMh4F07W0ZVY1TwCMW7ctOL28DpATywOFnWIDKH01/AAGhvGYfMYa',
		'2026-04-27 01:29:01.817+00'
	),
	(
		'847630b7-bf6c-4822-b3eb-0c69d525f8ec'::uuid,
		'kalebe@ccmergulho.com',
		'$2b$10$7ufgbHoizMjl7H6MXe.i7uPPFOa1/VSOB8dKEEybV6a5/l6TO6nZa',
		'2026-04-27 01:29:33.51+00'
	),
	(
		'40d44ab6-a865-4230-8774-2660819eb1af'::uuid,
		'guilherme@ccmergulho.com',
		'$2b$10$/SLumF.tA/Vl6Z6LKjifYe9JXKZHxMIKuxCLnA/RyAr133zJu0jFO',
		'2026-04-27 01:30:00.918+00'
	),
	(
		'573f4864-ccb2-4b39-ad8c-bc7bf1162bd8'::uuid,
		'gustavo@ccmergulho.com',
		'$2b$10$hxqlOuGCYePXMkko8ubg1uCKcf/5pa5VUi0TH7PhHsxzpKVQzTSVS',
		'2026-04-27 01:30:18.808+00'
	),
	(
		'19632ca8-8f4a-421e-9d7d-721c4a39348f'::uuid,
		'izabel@ccmergulho.com',
		'$2b$10$GNhMPGD7yKMZsMOIo2aPquwlvBUGkfNlK9Zs8rywUe4GY2/.C7gza',
		'2026-04-27 01:30:43.517+00'
	);
INSERT INTO public.users (id, email, "password", created_at)
VALUES (
		'7a026569-e1d9-4ead-b44c-7bf31552221d'::uuid,
		'jhony@ccmergulho.com',
		'$2b$10$B1JvjVQjQ.LB52gaAEsb/uhXMZgIGkOGVkLbevrTmM4K.wC1D88yy',
		'2026-04-27 01:31:14.212+00'
	),
	(
		'28eb1c29-6e18-4962-968a-9cb4b5b0e8ad'::uuid,
		'levy@ccmergulho.com',
		'$2b$10$9d8cx6FMc42J7x1xi1A.Eu1.wBAvoft.0uduSiuNn5geTEGtWdatW',
		'2026-04-27 01:31:33.112+00'
	),
	(
		'7b751d0f-2264-47dc-a591-c0cd7cdf3d2a'::uuid,
		'marialucia@ccmergulho.com',
		'$2b$10$lsL40YY3RY1y//BOVKbmze4hDVIn4NguiozK7YqFtAyG4xBKik9t.',
		'2026-04-27 01:32:06.112+00'
	),
	(
		'80190d83-4a0d-47e4-bb81-9ad12a918ca0'::uuid,
		'marilia@ccmergulho.com',
		'$2b$10$cbtGbRfIxJLrI/S4VlxYl.iHfwjWC2bsnii70sW33oIvwS8FPVF8C',
		'2026-04-27 01:32:28.214+00'
	),
	(
		'273ee85c-f299-4252-a275-d82e72ffe2be'::uuid,
		'meiry@ccmergulho.com',
		'$2b$10$1/iDNmLSgKDewyIBq48R7.OLljYxOS074k8fZ08I0npfR/tWJ5Gkm',
		'2026-04-27 01:32:56.908+00'
	),
	(
		'62c7c5ff-f706-426e-88dc-b7347295afc0'::uuid,
		'melina@ccmergulho.com',
		'$2b$10$YLGjZ5d6WsmWbBaGJ1sKNe7i/sARY9ijPpF9wTVD9IOteHc4pf9D2',
		'2026-04-27 01:33:17.013+00'
	),
	(
		'065e599c-a32f-4118-b262-2b6267b75667'::uuid,
		'miguel@ccmergulho.com',
		'$2b$10$XtPdVUWMZGmNIzDl2sHcDuLUY2vxS4bwjk3wb7fzOmMVGV.NP72ZW',
		'2026-04-27 01:33:41.522+00'
	),
	(
		'87e9b01f-c9a4-4d24-9dda-f8fb04a0ffe9'::uuid,
		'nielly@ccmergulho.com',
		'$2b$10$TtQXktcYcNIptR8/fh5HAuEW9fAlgayVgAOp2SJd6pszglKqpAjiS',
		'2026-04-27 01:34:05.109+00'
	),
	(
		'1706ad23-7635-4ef9-89af-75a6382cdbb6'::uuid,
		'pedromoreira@ccmergulho.com',
		'$2b$10$vg2YvG997hhP8zBw4IoaZuUVZYcQqfWgchHT8K1O9yUNY69RSsQvW',
		'2026-04-27 01:34:28.714+00'
	),
	(
		'4a309066-8121-4b9f-9097-21659ed3a655'::uuid,
		'penha@ccmergulho.com',
		'$2b$10$0rr9Z7zWD2Fa9D0JBPp/ne9fTCdgGDOLCfNkiU.MFiDnvyNzA4al.',
		'2026-04-27 01:34:49.487+00'
	);
INSERT INTO public.users (id, email, "password", created_at)
VALUES (
		'95b2ebbb-812f-4e9c-ac5b-bf11531c1382'::uuid,
		'raimunda@ccmergulho.com',
		'$2b$10$3oI3/rgaREQK6vQTj2HZxebWGzPYszRhdAjeSDQl2m73pEgY67zEW',
		'2026-04-27 01:35:08.113+00'
	),
	(
		'57af580c-3860-4739-acaf-c0c9f8474bf8'::uuid,
		'rogelma@ccmergulho.com',
		'$2b$10$Xs0HA9GHt.IkTlwc1ZAnh./MFsrMKtsCp1xv3Ye/cv7IfjXMXc94i',
		'2026-04-27 01:35:34.162+00'
	),
	(
		'5c4f4f3a-fdb1-49f3-8ff4-984bfd87c9b1'::uuid,
		'rosimeire@ccmergulho.com',
		'$2b$10$gKyaCcA8E9b3rntxoMw4j.qWg9PlH2QqLRRCcEx7xZJNW5dpeUvBG',
		'2026-04-27 01:35:54.615+00'
	),
	(
		'a0bfe5a4-0548-4933-a1b8-27e45eb0e14a'::uuid,
		'samya@ccmergulho.com',
		'$2b$10$ggSCEGCjOrrtJNZtsgUi7.XeavtSFw5.wBq50QGpkrmnJcr8k9YIy',
		'2026-04-27 01:36:15.813+00'
	),
	(
		'559e5c2e-f672-4f79-a6f5-8cacadb8b8aa'::uuid,
		'clara@ccmergulho.com',
		'$2b$10$GuNnk1CG1FQ37CojQJUte.nebYhgSYsgH7vHp2avGPpz5kKZL5Mri',
		'2026-04-27 01:36:42.51+00'
	),
	(
		'2d472fca-257d-4a28-b0a6-e4462811f3bd'::uuid,
		'taty@ccmergulho.com',
		'$2b$10$fk.5JYkycwU8dYRFaXDkben.Y7qQNodS2V/U7ulVkRlAiBubQLOAG',
		'2026-04-27 01:37:23.825+00'
	),
	(
		'c0fb8ca9-1a4d-4df0-8984-de025f1905a0'::uuid,
		'terezinha@ccmergulho.com',
		'$2b$10$/SlCHLFGCXmDtzYksjh3wOqWPBmLkQEBBICYSjkYPL.eys4LdOG/G',
		'2026-04-27 01:37:43.43+00'
	),
	(
		'b8054d49-2b8b-4d9d-b35c-0646893cdcf0'::uuid,
		'thyago@ccmergulho.com',
		'$2b$10$XDr/XrsvQ/3VMfHdFUrxg.hityY8N9rT4yWuF4p3iT77C3DINQxw2',
		'2026-04-27 01:38:06.212+00'
	),
	(
		'922ca237-bfb9-4424-8ba9-4706e8e2e200'::uuid,
		'leandro@ccmergulho.com',
		'$2b$10$tHKo3iueXBBG.AjVk1ErUOxdaZbCTc4iz5evqQM3PdYYQWMmhP7rq',
		'2026-04-27 01:38:26.32+00'
	),
	(
		'48cba748-94ce-4e34-aac1-7d02a9d81ff4'::uuid,
		'thaynara@ccmergulho.com',
		'$2b$10$NuCcOtYR8C4VnX4Cys6lDeJkA8sRnbjYgvDYxl3OgdSbT7di8Jg9i',
		'2026-04-26 19:44:41.401+00'
	);
INSERT INTO public.users (id, email, "password", created_at)
VALUES (
		'23693b0e-02ab-4f4d-8a97-1bec4e258477'::uuid,
		'semnome01@ccmergulho.com',
		'$2b$10$K0zK6dUXqgJNWGaCefil9uc3SgTS7xCPG3e5n3rPTDbeKTiLv7vCy',
		'2026-04-27 01:39:21.915+00'
	),
	(
		'b20ec0e2-6f3e-4051-b63c-65d040c889d1'::uuid,
		'semnome02@ccmergulho.com',
		'$2b$10$OkIO6yrdF6Hy8wSwhFqf5u3f59/ZXJePsUcj9BjzcfKkUduGpMIz.',
		'2026-04-27 01:39:49.241+00'
	),
	(
		'4f349bc9-b198-4199-836e-527c58d6a980'::uuid,
		'semnome03@ccmergulho.com',
		'$2b$10$F0Vc.Tan4Zs5c7vnWbLwt.K4fsNT1.VpJ5204VM7BkjOCHALqKeDe',
		'2026-04-27 01:40:26.427+00'
	),
	(
		'a82c88ba-ff52-4421-b758-07c942e0c8fe'::uuid,
		'jhonny@ccmergulho.com',
		'$2b$10$hfOpwVwXLPx6pUpYDS6rzuEQrcGEqsXVWYmD6ih1B5mRg5O2u0u6S',
		'2026-04-27 01:41:00.926+00'
	),
	(
		'1ecf05e3-e943-477b-bcbf-231b8a1a8988'::uuid,
		'mily@ccmergulho.com',
		'$2b$10$IjjwDJw.7E2Dvx64DNB4Uu2vFm/XpKhvKDWBUPLQi4FO8M2Le5qym',
		'2026-04-27 01:41:18.413+00'
	),
	(
		'f2ec7429-e00b-4b3c-a7b1-f99aab8922d4'::uuid,
		'jarde@ccmergulho.com',
		'$2b$10$5OivSG3Wex9Bz.WTIQVlZOYJLnweX.gxXWTBjdyShPsPDUP71J7M2',
		'2026-04-26 19:58:10.58+00'
	),
	(
		'f89b521d-46e6-4ad2-a54b-628fac94d64d'::uuid,
		'lucas@ccmergulho.com',
		'$2b$10$zH68LupSKvNxuyJpP2x5j.Jgoj.dnmm5IR9tNsmXint.D.5yYaurS',
		'2026-04-27 03:24:42.624+00'
	);