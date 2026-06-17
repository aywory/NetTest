questions = [
    {
        "number": 1,
        "answer": 0,
        "options": [
            "Модем",
            "Маршрутизатор",
            "Коммутатор",
            "Концентратор",
        ],
    },
    {
        "number": 2,
        "answer": 3,
        "options": [
            "802.11b",
            "802.11g",
            "802.11n",
            "802.11ac",
        ],
    },
    {
        "number": 3,
        "answer": 1,
        "options": [
            "Бит",
            "Кадр (Frame)",
            "Пакет",
            "Сегмент",
        ],
    },
    {
        "number": 4,
        "answer": 1,
        "options": [
            "Прикладного уровня",
            "Уровня представления",
            "Физического уровня",
            "Канального уровня",
        ],
    },
    {
        "number": 5,
        "answer": 2,
        "options": [
            "Динамически распределяется между пользователями",
            "Зависит от типа передаваемого файла",
            "Гарантирована для установленного соединения",
            "Ограничена скоростью самого медленного узла",
        ],
    },
    {
        "number": 6,
        "answer": 0,
        "options": [
            "RARP (Reverse ARP)",
            "InARP",
            "DHCP",
            "BOOTP",
        ],
    },
    {
        "number": 7,
        "answer": 1,
        "options": [
            "Сетевой",
            "Транспортный",
            "Сеансовый",
            "Прикладной",
        ],
    },
    {
        "number": 8,
        "answer": 0,
        "options": [
            "1–1005",
            "1006–4094",
            "1–4094",
            "100–1000",
        ],
    },
    {
        "number": 9,
        "answer": 3,
        "options": [
            "show ip interface brief",
            "show running-config",
            "show vtp status",
            "show dtp interface / show interfaces switchport",
        ],
    },
    {
        "number": 10,
        "answer": 1,
        "options": [
            "Разрешает на транке только VLAN 10 и 20, удаляя остальные",
            "Добавляет VLAN 10 и 20 в список разрешенных на транке",
            "Создает новые VLAN",
            "Удаляет VLAN 10 и 20",
        ],
    },
    {
        "number": 11,
        "answer": 2,
        "options": [
            "IP-адрес управления",
            "Количество MAC-адресов в таблице CAM",
            "Приоритет (Priority) и MAC-адрес",
            "Скорость портов (1G/10G)",
        ],
    },
    {
        "number": 12,
        "answer": 1,
        "options": [
            "Переход клиента между разными SSID без разрыва соединения",
            "Переход клиента от одной точки доступа к другой без потери пакетов и прерывания сессии",
            "Подключение к интернету через спутник",
            "Автоматическое изменение пароля",
        ],
    },
    {
        "number": 13,
        "answer": 1,
        "options": [
            "Перемещение клиента между разными подсетями (L3)",
            "Перемещение клиента между точками доступа в пределах одной подсети (VLAN)",
            "Переключение между 2.4 и 5 ГГц",
            "Подключение к VPN",
        ],
    },
    {
        "number": 14,
        "answer": 1,
        "options": [
            "Она самая дешевая в реализации",
            "Она легко расширяется путем подключения новых лучей к центру",
            "Она не требует центрального устройства",
            "Она неуязвима к сбоям",
        ],
    },
    {
        "number": 15,
        "answer": 1,
        "options": [
            "Клиент-серверную",
            "Точку-точку (Peer-to-peer/IBSS)",
            "Инфраструктурную звезду",
            "Иерархическую",
        ],
    },
]


def main():
    strictly_longest = []
    tied_longest = []

    for question in questions:
        answer_index = question["answer"]
        lengths = [len(option) for option in question["options"]]
        answer_length = lengths[answer_index]
        max_length = max(lengths)
        other_lengths = [length for index, length in enumerate(lengths) if index != answer_index]

        is_strictly_longest = answer_length > max(other_lengths)
        is_tied_longest = answer_length == max_length and not is_strictly_longest

        if is_strictly_longest:
            strictly_longest.append(question["number"])
        if is_tied_longest:
            tied_longest.append(question["number"])

        print(
            f"Вопрос {question['number']:>2}: "
            f"правильный вариант длиной {answer_length:>2}, "
            f"максимум среди вариантов {max_length:>2}, "
            f"{'длиннее всех' if is_strictly_longest else 'не длиннее всех'}"
        )

    total = len(questions)
    percent = len(strictly_longest) / total * 100

    print()
    print(f"Всего вопросов: {total}")
    print(f"Правильный ответ строго длиннее всех остальных: {len(strictly_longest)}")
    print(f"Процент: {percent:.2f}%")
    print(f"Номера таких вопросов: {strictly_longest}")
    print(f"Правильный ответ делит максимум по длине с другим вариантом: {tied_longest}")


if __name__ == "__main__":
    main()
