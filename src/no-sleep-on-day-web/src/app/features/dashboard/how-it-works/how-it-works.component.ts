import { Component } from '@angular/core';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  template: `
    <section class="how">
      <div class="how__steps">
        <div class="how__step">
          <span class="how__icon">🗺</span>
          <div class="how__text">
            <strong>Выберите регион</strong>
            <span>Кликните на карту или выберите из списка</span>
          </div>
        </div>
        <div class="how__divider"></div>
        <div class="how__step">
          <span class="how__icon">⏰</span>
          <div class="how__text">
            <strong>Задайте график сна</strong>
            <span>Укажите привычное время подъёма и отбоя</span>
          </div>
        </div>
        <div class="how__divider"></div>
        <div class="how__step">
          <span class="how__icon">🕐</span>
          <div class="how__text">
            <strong>Выберите сдвиг пояса</strong>
            <span>На сколько часов можно было бы перевести время</span>
          </div>
        </div>
        <div class="how__divider"></div>
        <div class="how__step">
          <span class="how__icon">☀️</span>
          <div class="how__text">
            <strong>Смотрите результат</strong>
            <span>Сколько световых часов в год вы приобретёте</span>
          </div>
        </div>
      </div>

      <p class="how__map-note">
        <span class="how__map-swatch how__map-swatch--good"></span>На карте цветом выделены регионы с неоптимальными часовыми поясами —
        <span class="how__map-swatch how__map-swatch--bad"></span>чем краснее регион, тем больше светлых часов он теряет при текущем поясе.
      </p>
    </section>
  `,
  styleUrl: './how-it-works.component.scss',
})
export class HowItWorksComponent {}
