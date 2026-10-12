-- Passenger route advisories. Run after Translation_UI has been created.
-- Safe to rerun: existing keys are updated; missing keys are inserted.
-- Every displayed warning is sourced from Translation_UI for all map languages.
SET NOCOUNT ON;

MERGE dbo.Translation_UI WITH (HOLDLOCK) AS target
USING (VALUES
  ('rn_title', 'title',
   N'Lưu ý về thủ tục sân bay', N'Airport procedure advisory',
   N'机场通行手续提示', N'空港手続きのご案内', N'공항 수속 안내'),

  ('rn_staff_access', 'notice',
   N'Điểm đến thuộc khu vực hạn chế ra vào. Chỉ người có thẩm quyền hoặc được cấp phép mới được tiếp cận. Vui lòng tuân thủ biển báo và hướng dẫn của nhân viên sân bay.',
   N'The destination is in a restricted-access area. Entry is limited to authorized personnel. Please follow airport signs and staff instructions.',
   N'目的地位于限制进入区域，仅限获授权人员通行。请遵守机场标识及工作人员指引。',
   N'目的地は立入制限区域です。許可された方のみ入れます。空港の案内表示と係員の指示に従ってください。',
   N'목적지는 출입 제한 구역입니다. 허가받은 사람만 출입할 수 있습니다. 공항 표지판과 직원 안내를 따라주세요.'),

  ('rn_security_checkpoint', 'notice',
   N'Điểm đến là khu vực kiểm soát thủ tục. Vui lòng chuẩn bị giấy tờ cần thiết và thực hiện kiểm tra an ninh, xuất nhập cảnh hoặc hải quan theo yêu cầu tại điểm kiểm soát.',
   N'The destination is a controlled checkpoint. Please prepare the required documents and complete security, immigration or customs checks as directed.',
   N'目的地为手续检查区域。请备好所需证件，并按现场指引完成安检、出入境或海关检查。',
   N'目的地は手続き上の検査エリアです。必要書類を準備し、案内に従って保安検査、出入国審査、税関検査を受けてください。',
   N'목적지는 출입 심사 구역입니다. 필요한 서류를 준비하고 안내에 따라 보안 검색, 출입국 심사 또는 세관 검사를 받으세요.'),

  ('rn_intl_arrival_area', 'notice',
   N'Điểm đến thuộc khu vực hành khách đến quốc tế. Việc tiếp cận khu vực này có thể phải qua kiểm soát nhập cảnh, nhận hành lý và hải quan theo quy định.',
   N'The destination is in the international arrivals area. Access may require immigration clearance, baggage collection and customs procedures.',
   N'目的地位于国际到达区。进入该区域可能需要完成入境检查、行李提取及海关手续。',
   N'目的地は国際線到着エリアです。入域には入国審査、手荷物受取、税関手続きが必要となる場合があります。',
   N'목적지는 국제선 도착 구역입니다. 출입 시 입국 심사, 수하물 수취 및 세관 절차가 필요할 수 있습니다.'),

  ('rn_dom_arrival_area', 'notice',
   N'Điểm đến thuộc khu vực hành khách đến quốc nội. Vui lòng sử dụng lối đi dành cho hành khách đến và tuân thủ quy định tiếp cận khu vực nhận hành lý.',
   N'The destination is in the domestic arrivals area. Please use the designated arrivals route and follow baggage-claim access rules.',
   N'目的地位于国内到达区。请沿旅客到达通道行进，并遵守行李提取区的出入规定。',
   N'目的地は国内線到着エリアです。到着旅客用の通路を利用し、手荷物受取所の立入規則に従ってください。',
   N'목적지는 국내선 도착 구역입니다. 도착 승객 전용 통로를 이용하고 수하물 수취 구역 출입 규정을 따라주세요.'),

  ('rn_transfer_dd', 'notice',
   N'Bạn đang di chuyển từ khu vực đến hoặc nhận hành lý quốc nội đến khu cách ly khởi hành quốc nội. Vui lòng hoàn tất thủ tục nối chuyến hoặc check-in và soi chiếu an ninh theo hướng dẫn trước khi vào khu vực chờ lên máy bay.',
   N'You are moving from domestic arrivals or baggage claim to the domestic departure airside area. Complete any required transfer or check-in procedures and security screening before entering the boarding area.',
   N'您正从国内到达或行李提取区前往国内出发隔离区。进入候机区前，请按指引完成所需的转机或值机手续及安检。',
   N'国内線到着・手荷物受取エリアから国内線出発の制限エリアへ移動します。搭乗エリアに入る前に、必要な乗継ぎ・チェックイン手続きと保安検査を済ませてください。',
   N'국내선 도착 또는 수하물 수취 구역에서 국내선 출발 보안 구역으로 이동합니다. 탑승 구역에 들어가기 전에 필요한 환승 또는 체크인 수속과 보안 검색을 완료하세요.'),

  ('rn_transfer_di', 'notice',
   N'Bạn đang di chuyển từ khu vực quốc nội đến khu cách ly khởi hành quốc tế. Vui lòng hoàn tất thủ tục nối chuyến hoặc check-in quốc tế (nếu cần), soi chiếu an ninh và xuất cảnh theo hướng dẫn trước khi vào khu vực này.',
   N'You are moving from a domestic area to international departure airside. Complete any required international transfer or check-in procedures, security screening and departure immigration before entering.',
   N'您正从国内区域前往国际出发隔离区。进入前，请按指引完成所需的国际转机或值机手续、安检及出境检查。',
   N'国内線エリアから国際線出発の制限エリアへ移動します。入域前に、必要な国際線乗継ぎ・チェックイン手続き、保安検査、出国審査を済ませてください。',
   N'국내선 구역에서 국제선 출발 보안 구역으로 이동합니다. 입장 전에 필요한 국제선 환승 또는 체크인 수속, 보안 검색 및 출국 심사를 완료하세요.'),

  ('rn_transfer_id', 'notice',
   N'Bạn đang di chuyển từ khu vực quốc tế đến khu cách ly khởi hành quốc nội. Vui lòng hoàn tất thủ tục nhập cảnh (nếu áp dụng), nối chuyến hoặc check-in quốc nội và soi chiếu an ninh theo hướng dẫn.',
   N'You are moving from an international area to domestic departure airside. Complete arrival immigration (if applicable), domestic transfer or check-in procedures, and security screening as directed.',
   N'您正从国际区域前往国内出发隔离区。请按指引完成入境检查（如适用）、国内转机或值机手续及安检。',
   N'国際線エリアから国内線出発の制限エリアへ移動します。該当する場合の入国審査、国内線乗継ぎ・チェックイン手続き、保安検査を案内に従って済ませてください。',
   N'국제선 구역에서 국내선 출발 보안 구역으로 이동합니다. 해당되는 경우 입국 심사, 국내선 환승 또는 체크인 수속, 보안 검색을 완료하세요.'),

  ('rn_transfer_ii', 'notice',
   N'Bạn đang di chuyển từ khu vực đến hoặc nhận hành lý quốc tế đến khu cách ly khởi hành quốc tế. Vui lòng thực hiện thủ tục nối chuyến, soi chiếu an ninh và xuất nhập cảnh theo yêu cầu đối với hành trình của bạn.',
   N'You are moving from international arrivals or baggage claim to international departure airside. Follow the transfer, security and immigration procedures required for your itinerary.',
   N'您正从国际到达或行李提取区前往国际出发隔离区。请按行程要求办理转机、安检及出入境手续。',
   N'国際線到着・手荷物受取エリアから国際線出発の制限エリアへ移動します。旅程に応じた乗継ぎ、保安検査、出入国審査の手続きに従ってください。',
   N'국제선 도착 또는 수하물 수취 구역에서 국제선 출발 보안 구역으로 이동합니다. 여정에 필요한 환승, 보안 검색 및 출입국 절차를 따라주세요.'),

  ('rn_intl_from_domestic_checkin', 'notice',
   N'Điểm đến thuộc khu cách ly khởi hành quốc tế, trong khi điểm đi là quầy check-in quốc nội. Vui lòng hoàn tất thủ tục check-in cho chuyến bay quốc tế tại khu vực phù hợp, soi chiếu an ninh và xuất cảnh theo quy định trước khi vào khu vực này.',
   N'The destination is in international departure airside, while your starting point is a domestic check-in counter. Please complete international flight check-in at the appropriate counters, security screening and departure immigration before entering.',
   N'目的地位于国际出发隔离区，而出发点为国内值机柜台。进入前，请前往相应柜台办理国际航班值机，并完成安检及出境检查。',
   N'目的地は国際線出発の制限エリアですが、出発地点は国内線チェックインカウンターです。入域前に適切なカウンターで国際線のチェックイン、保安検査、出国審査を済ませてください。',
   N'목적지는 국제선 출발 보안 구역이며 출발지는 국내선 체크인 카운터입니다. 입장 전에 해당 카운터에서 국제선 체크인, 보안 검색 및 출국 심사를 완료하세요.'),

  ('rn_dom_from_international_checkin', 'notice',
   N'Điểm đến thuộc khu cách ly khởi hành quốc nội, trong khi điểm đi là quầy check-in quốc tế. Vui lòng hoàn tất thủ tục check-in cho chuyến bay quốc nội tại khu vực phù hợp và soi chiếu an ninh theo hướng dẫn trước khi vào khu vực này.',
   N'The destination is in domestic departure airside, while your starting point is an international check-in counter. Please complete domestic flight check-in at the appropriate counters and security screening before entering.',
   N'目的地位于国内出发隔离区，而出发点为国际值机柜台。进入前，请前往相应柜台办理国内航班值机并完成安检。',
   N'目的地は国内線出発の制限エリアですが、出発地点は国際線チェックインカウンターです。入域前に適切なカウンターで国内線のチェックインと保安検査を済ませてください。',
   N'목적지는 국내선 출발 보안 구역이며 출발지는 국제선 체크인 카운터입니다. 입장 전에 해당 카운터에서 국내선 체크인 및 보안 검색을 완료하세요.'),

  ('rn_intl_departure', 'notice',
   N'Điểm đến thuộc khu cách ly khởi hành quốc tế. Vui lòng đảm bảo đã hoàn tất thủ tục check-in chuyến bay quốc tế, soi chiếu an ninh và xuất cảnh theo quy định trước khi vào khu vực này.',
   N'The destination is in international departure airside. Please ensure you have completed international flight check-in, security screening and departure immigration as required before entering.',
   N'目的地位于国际出发隔离区。进入前，请确认已按规定完成国际航班值机、安检及出境检查。',
   N'目的地は国際線出発の制限エリアです。入域前に、必要な国際線チェックイン、保安検査、出国審査を済ませてください。',
   N'목적지는 국제선 출발 보안 구역입니다. 입장 전에 필요한 국제선 체크인, 보안 검색 및 출국 심사를 완료하세요.'),

  ('rn_dom_departure', 'notice',
   N'Điểm đến thuộc khu cách ly khởi hành quốc nội. Vui lòng đảm bảo đã hoàn tất thủ tục check-in chuyến bay quốc nội và soi chiếu an ninh theo quy định trước khi vào khu vực này.',
   N'The destination is in domestic departure airside. Please ensure you have completed domestic flight check-in and security screening as required before entering.',
   N'目的地位于国内出发隔离区。进入前，请确认已按规定完成国内航班值机及安检。',
   N'目的地は国内線出発の制限エリアです。入域前に、必要な国内線チェックインと保安検査を済ませてください。',
   N'목적지는 국내선 출발 보안 구역입니다. 입장 전에 필요한 국내선 체크인과 보안 검색을 완료하세요.'),

  ('rn_departure_check', 'notice',
   N'Điểm đến thuộc khu vực phục vụ hành khách khởi hành nhưng chưa xác định rõ luồng quốc nội hay quốc tế. Vui lòng kiểm tra đúng khu vực làm thủ tục và hoàn tất các bước kiểm soát tương ứng với chuyến bay của bạn.',
   N'The destination serves departing passengers, but its domestic or international access flow is not clearly identified. Please confirm the correct check-in area and complete the procedures required for your flight.',
   N'目的地为出发旅客区域，但无法明确区分国内或国际航班通行路线。请确认正确的值机区域，并完成航班所需的相关检查手续。',
   N'目的地は出発旅客向けエリアですが、国内線・国際線の区分を特定できません。適切なチェックインエリアを確認し、搭乗便に必要な検査・手続きを済ませてください。',
   N'목적지는 출발 승객 구역이지만 국내선 또는 국제선 동선이 명확하지 않습니다. 올바른 체크인 구역을 확인하고 항공편에 필요한 절차를 완료하세요.'),

  ('rn_leave_airside', 'notice',
   N'Lộ trình đưa bạn ra khỏi khu vực cách ly khởi hành. Việc quay lại có thể yêu cầu kiểm tra an ninh hoặc thủ tục bổ sung. Vui lòng kiểm tra quyền tiếp cận và tuân thủ chỉ dẫn tại các điểm kiểm soát.',
   N'This route leads out of departure airside. Re-entry may require security screening or additional procedures. Please check access conditions and follow checkpoint instructions.',
   N'此路线将带您离开出发隔离区。再次进入可能需要重新安检或办理其他手续。请确认通行条件并遵循检查点指引。',
   N'この経路では出発の制限エリアの外へ出ます。再入域には保安検査や追加手続きが必要となる場合があります。通行条件を確認し、検査場の案内に従ってください。',
   N'이 경로는 출발 보안 구역 밖으로 나갑니다. 재입장 시 보안 검색이나 추가 수속이 필요할 수 있습니다. 출입 조건을 확인하고 검문소 안내를 따르세요.'),

  ('rn_checkin_intl_from_dom', 'notice',
   N'Điểm đến là quầy check-in quốc tế, trong khi điểm đi thuộc khu vực check-in quốc nội. Vui lòng di chuyển đến đúng khu vực làm thủ tục cho chuyến bay quốc tế và chuẩn bị giấy tờ xuất cảnh cần thiết.',
   N'The destination is an international check-in counter, while your starting point is a domestic check-in area. Please proceed to the correct international check-in area and prepare the required travel documents.',
   N'目的地为国际值机柜台，而出发点位于国内值机区。请前往正确的国际航班值机区域，并准备所需出境证件。',
   N'目的地は国際線チェックインカウンターですが、出発地点は国内線チェックインエリアです。適切な国際線カウンターに進み、必要な渡航書類を準備してください。',
   N'목적지는 국제선 체크인 카운터이고 출발지는 국내선 체크인 구역입니다. 올바른 국제선 체크인 구역으로 이동하여 필요한 여행 서류를 준비하세요.'),

  ('rn_checkin_dom_from_intl', 'notice',
   N'Điểm đến là quầy check-in quốc nội, trong khi điểm đi thuộc khu vực check-in quốc tế. Vui lòng di chuyển đến đúng khu vực làm thủ tục cho chuyến bay quốc nội và chuẩn bị giấy tờ tùy thân cần thiết.',
   N'The destination is a domestic check-in counter, while your starting point is an international check-in area. Please proceed to the correct domestic check-in area and prepare the required identification.',
   N'目的地为国内值机柜台，而出发点位于国际值机区。请前往正确的国内航班值机区域，并准备所需身份证件。',
   N'目的地は国内線チェックインカウンターですが、出発地点は国際線チェックインエリアです。適切な国内線カウンターに進み、必要な本人確認書類を準備してください。',
   N'목적지는 국내선 체크인 카운터이고 출발지는 국제선 체크인 구역입니다. 올바른 국내선 체크인 구역으로 이동하여 필요한 신분증을 준비하세요.'),

  ('rn_intl_arrival_exit', 'notice',
   N'Bạn đang di chuyển từ khu vực đến quốc tế ra sảnh công cộng. Vui lòng hoàn tất thủ tục nhập cảnh, nhận hành lý ký gửi (nếu có) và hải quan theo quy định trước khi ra ngoài.',
   N'You are moving from international arrivals to the public hall. Please complete immigration, checked-baggage collection (if applicable) and customs procedures before exiting.',
   N'您正从国际到达区前往公共大厅。离开前，请按规定完成入境检查、托运行李提取（如有）及海关手续。',
   N'国際線到着エリアから一般エリアへ移動します。出る前に、入国審査、預け入れ手荷物の受取（ある場合）、税関手続きを済ませてください。',
   N'국제선 도착 구역에서 일반 구역으로 이동합니다. 나가기 전에 입국 심사, 위탁 수하물 수취(해당 시) 및 세관 절차를 완료하세요.'),

  ('rn_dom_arrival_exit', 'notice',
   N'Bạn đang di chuyển từ khu vực đến quốc nội ra sảnh công cộng. Vui lòng nhận đủ hành lý ký gửi (nếu có) và sử dụng lối ra dành cho hành khách đến quốc nội.',
   N'You are moving from domestic arrivals to the public hall. Please collect any checked baggage and use the designated domestic arrivals exit.',
   N'您正从国内到达区前往公共大厅。请提取托运行李（如有），并使用国内到达旅客出口。',
   N'国内線到着エリアから一般エリアへ移動します。預け入れ手荷物がある場合は受け取り、国内線到着旅客用の出口をご利用ください。',
   N'국내선 도착 구역에서 일반 구역으로 이동합니다. 위탁 수하물이 있으면 수취한 후 국내선 도착 승객 전용 출구를 이용하세요.')
) AS source (KeyCode, KeyType, VN, EN, ZH, JA, KO)
ON target.KeyCode = source.KeyCode
WHEN MATCHED THEN
  UPDATE SET KeyType = source.KeyType, VN = source.VN, EN = source.EN,
             ZH = source.ZH, JA = source.JA, KO = source.KO
WHEN NOT MATCHED BY TARGET THEN
  INSERT (KeyCode, KeyType, VN, EN, ZH, JA, KO)
  VALUES (source.KeyCode, source.KeyType, source.VN, source.EN,
          source.ZH, source.JA, source.KO);

SELECT KeyCode, KeyType, VN, EN, ZH, JA, KO
FROM dbo.Translation_UI
WHERE KeyCode LIKE 'rn[_]%'
ORDER BY KeyCode;
